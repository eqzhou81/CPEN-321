import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import {
  IJobSearchParams,
  IJobSimilarityScore,
  IScraperConfig,
  IScraperResult,
  ISimilarJob
} from '../types/job.types';
import { LocationUtils } from '../utils/location.util';
import logger from '../utils/logger.util';

export class JobSearchService {
  private readonly scraperConfigs: Record<string, IScraperConfig> = {
    indeed: {
      baseUrl: 'https://www.indeed.com',
      searchPath: '/jobs',
      selectors: {
        jobCard: '[data-jk], .job_seen_beacon, .jobsearch-SerpJobCard',
        title: 'h2.jobTitle a span[title], h2.jobTitle a, .jobTitle a span, .jobTitle a',
        company: '.companyName, .company, [data-testid="company-name"]',
        location: '.companyLocation, .location, [data-testid="job-location"]',
        description: '.job-snippet, .summary, .jobDescriptionContent',
        url: 'h2.jobTitle a, .jobTitle a, a[data-jk]',
        salary: '.salary-snippet, .salary, [data-testid="salary"]',
        postedDate: '.date, .posted, [data-testid="date"]'
      },
      pagination: {
        nextButton: 'a[aria-label="Next Page"], a[aria-label="Next"]',
        maxPages: 5
      }
    },
    linkedin: {
      baseUrl: 'https://www.linkedin.com',
      searchPath: '/jobs/search',
      selectors: {
        jobCard: '.jobs-search-results__list-item, .job-search-card, [data-job-id]',
        title: '.job-search-card__title a, .job-title a, h3 a',
        company: '.job-search-card__subtitle-link, .job-search-card__company-name, .company-name',
        location: '.job-search-card__location, .job-location, .location',
        description: '.job-search-card__snippet, .job-description, .description',
        url: '.job-search-card__title a, .job-title a, h3 a',
        salary: '.job-search-card__salary, .salary, .compensation',
        postedDate: 'time, .job-posted-date, .posted-date'
      },
      pagination: {
        nextButton: 'button[aria-label="Next"], .next-button',
        maxPages: 3
      }
    },
    glassdoor: {
      baseUrl: 'https://www.glassdoor.com',
      searchPath: '/Job/jobs.htm',
      selectors: {
        jobCard: '.react-job-listing, .jobListing, [data-test="jobListing"]',
        title: '.jobLink, .job-title a, h3 a',
        company: '.jobInfoItem .employerName, .company-name, .employer',
        location: '.jobInfoItem .loc, .location, .job-location',
        description: '.jobDescriptionContent, .job-description, .description',
        url: '.jobLink, .job-title a, h3 a',
        salary: '.salaryText, .salary, .compensation',
        postedDate: '.jobAge, .posted-date, .date'
      },
      pagination: {
        nextButton: '.nextButton, .next-button, [aria-label="Next"]',
        maxPages: 3
      }
    }
  };

  /**
   * Search for similar jobs based on a job application
   */
  async searchSimilarJobs(
    jobApplication: any,
    searchParams: Partial<IJobSearchParams> = {}
  ): Promise<ISimilarJob[]> {
    try {
      const params: IJobSearchParams = {
        title: jobApplication.title,
        company: jobApplication.company,
        location: jobApplication.location,
        radius: 25,
        limit: 20,
        remote: true,
        ...searchParams
      };

      logger.info('Starting job search with params:', params);

      // Search multiple job sites in parallel with timeout
      const searchPromises = Object.keys(this.scraperConfigs).map(source =>
        Promise.race([
          this.scrapeJobSite(source, params),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout for ${source}`)), 30000) // 30 second timeout
          )
        ])
      );

      const results = await Promise.allSettled(searchPromises);
      
      // Combine results from all sources
      let allJobs: ISimilarJob[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && (result.value as any).jobs) {
          allJobs = allJobs.concat((result.value as any).jobs);
        } else {
          logger.warn(`Failed to scrape ${Object.keys(this.scraperConfigs)[index]}:`, result);
        }
      });

      // Remove duplicates and calculate similarity scores
      const uniqueJobs = this.removeDuplicateJobs(allJobs);
      const scoredJobs = await this.calculateSimilarityScores(uniqueJobs, jobApplication);
      
      // Sort by similarity score and limit results
      const sortedJobs = scoredJobs
        .sort((a, b) => b.score - a.score)
        .slice(0, params.limit || 20)
        .map(item => item.job);

      logger.info(`Found ${sortedJobs.length} similar jobs`);
      return sortedJobs;

    } catch (error) {
      logger.error('Error searching for similar jobs:', error);
      throw new Error('Failed to search for similar jobs');
    }
  }

  /**
   * Find similar jobs using multiple strategies: web scraping + database fallback
   */
  async findSimilarJobs(
    jobId: string,
    userId: string,
    limit: number = 5
  ): Promise<ISimilarJob[]> {
    try {
      // First try web scraping from alternative sources
      const scrapedJobs = await this.scrapeSimilarJobsFromAlternativeSources(jobId, limit);
      
      if (scrapedJobs.length > 0) {
        logger.info(`Found ${scrapedJobs.length} similar jobs from web scraping`);
        return scrapedJobs.slice(0, limit);
      }
      
      // Fallback to database similarity if scraping fails
      logger.info('Web scraping failed, falling back to database similarity');
      const jobApplication = await this.getJobById(jobId);
      if (!jobApplication) {
        throw new Error('Job not found');
      }
      return await this.findSimilarJobsFromDatabase(jobApplication, userId, { limit });
      
    } catch (error) {
      logger.error('Error in findSimilarJobs:', error);
      // Always fallback to database similarity
      const jobApplication = await this.getJobById(jobId);
      if (!jobApplication) {
        return [];
      }
      return await this.findSimilarJobsFromDatabase(jobApplication, userId, { limit });
    }
  }

  /**
   * Scrape similar jobs from alternative sources (RSS feeds, APIs, less protected sites)
   */
  private async scrapeSimilarJobsFromAlternativeSources(
    jobId: string,
    limit: number
  ): Promise<ISimilarJob[]> {
    const similarJobs: ISimilarJob[] = [];
    
    try {
      // Get the original job to extract keywords
      const originalJob = await this.getJobById(jobId);
      if (!originalJob) {
        throw new Error('Original job not found');
      }

      // Extract search keywords from the original job
      const searchKeywords = this.extractSearchKeywords(originalJob);
      
      // Try multiple alternative sources
      const sources = [
        () => this.scrapeFromGitHubJobs(searchKeywords),
        () => this.scrapeFromRemoteOK(searchKeywords),
        () => this.scrapeFromAngelList(searchKeywords),
        () => this.scrapeFromCompanyCareerPages(searchKeywords),
        () => this.scrapeFromJobRSSFeeds(searchKeywords)
      ];

      // Try each source until we get enough results
      for (const source of sources) {
        try {
          const jobs = await source();
          similarJobs.push(...jobs);
          
          if (similarJobs.length >= limit) {
            break;
          }
        } catch (error) {
          logger.warn(`Failed to scrape from source: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
      }

      // Calculate similarity scores and sort
      const scoredJobs = similarJobs.map(job => ({
        ...job,
        score: this.calculateJobSimilarity(originalJob, job)
      }));

      return scoredJobs
        .filter(job => job.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error in scrapeSimilarJobsFromAlternativeSources:', error);
      return [];
    }
  }

  /**
   * Extract search keywords from a job for finding similar positions
   */
  private extractSearchKeywords(job: any): string[] {
    const keywords: string[] = [];
    
    // Extract from title
    if (job.title) {
      keywords.push(...this.extractKeywords(job.title));
    }
    
    // Extract from description
    if (job.description) {
      keywords.push(...this.extractKeywords(job.description));
    }
    
    // Extract from company
    if (job.company) {
      keywords.push(job.company.toLowerCase());
    }
    
    // Extract technical keywords
    const techKeywords = this.extractTechnicalKeywords(job.description || '');
    keywords.push(...techKeywords);
    
    // Remove duplicates and filter out common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall']);
    
    return [...new Set(keywords)]
      .filter(keyword => keyword.length > 2 && !stopWords.has(keyword.toLowerCase()))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Scrape jobs from GitHub Jobs API (if available) or similar developer-focused sources
   */
  private async scrapeFromGitHubJobs(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      // Try GitHub Jobs API (deprecated but some alternatives exist)
      const searchQuery = keywords.slice(0, 3).join(' ');
      
      // Alternative: Try Stack Overflow Jobs or similar developer-focused APIs
      const response = await fetch(`https://jobs.github.com/positions.json?description=${encodeURIComponent(searchQuery)}&location=remote`);
      
      if (response.ok) {
        const data = await response.json();
        
        for (const job of data.slice(0, 5)) {
          jobs.push({
            title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description || '',
            url: job.url || '',
            salary: job.salary || '',
            postedDate: job.created_at || new Date().toISOString(),
            source: 'github_jobs',
            score: 0 // Will be calculated later
          });
        }
      }
    } catch (error) {
      logger.warn('GitHub Jobs scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from RemoteOK (remote job board)
   */
  private async scrapeFromRemoteOK(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      const searchQuery = keywords.slice(0, 2).join(' ');
      const response = await fetch(`https://remoteok.io/api?tags=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        for (const job of data.slice(1, 6)) { // Skip first element (metadata)
          if (job.position && job.company) {
            jobs.push({
              title: job.position,
              company: job.company,
              location: 'Remote',
              description: job.description || '',
              url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
              salary: job.salary || '',
              postedDate: job.date || new Date().toISOString(),
              source: 'remoteok',
              score: 0
            });
          }
        }
      }
    } catch (error) {
      logger.warn('RemoteOK scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from AngelList (startup jobs)
   */
  private async scrapeFromAngelList(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      // AngelList has been acquired by Wellfound, but we can try their API
      const searchQuery = keywords.slice(0, 2).join(' ');
      
      // Try to scrape from Wellfound (formerly AngelList)
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      try {
        await page.goto(`https://wellfound.com/jobs?search=${encodeURIComponent(searchQuery)}`, {
          waitUntil: 'networkidle2',
          timeout: 10000
        });
        
        const jobData = await page.evaluate(() => {
          const jobs: any[] = [];
          const jobCards = document.querySelectorAll('[data-test="JobCard"], .job-card, .job-listing');
          
          for (const card of Array.from(jobCards).slice(0, 5)) {
            const titleEl = card.querySelector('h3, .job-title, [data-test="JobCard-title"]');
            const companyEl = card.querySelector('.company-name, [data-test="JobCard-company"]');
            const locationEl = card.querySelector('.location, [data-test="JobCard-location"]');
            const linkEl = card.querySelector('a');
            
            if (titleEl && companyEl) {
              jobs.push({
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim() || '',
                location: locationEl?.textContent?.trim() || 'Remote',
                description: '',
                url: linkEl?.href || '',
                salary: '',
                postedDate: new Date().toISOString(),
                source: 'wellfound'
              });
            }
          }
          
          return jobs;
        });
        
        jobs.push(...jobData.map(job => ({ ...job, score: 0 })));
        
      } catch (pageError) {
        logger.warn('Wellfound page scraping failed:', pageError instanceof Error ? pageError.message : String(pageError));
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.warn('AngelList scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from company career pages (less protected)
   */
  private async scrapeFromCompanyCareerPages(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      // List of companies known to have open career pages
      const companies = ['netflix', 'spotify', 'stripe', 'shopify', 'airbnb'];
      const searchQuery = keywords.slice(0, 2).join(' ');
      
      for (const company of companies.slice(0, 2)) { // Limit to 2 companies to avoid timeout
        try {
          const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          
          // Try common career page patterns
          const careerUrls = [
            `https://${company}.com/careers`,
            `https://${company}.com/jobs`,
            `https://jobs.${company}.com`,
            `https://careers.${company}.com`
          ];
          
          for (const url of careerUrls) {
            try {
              await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
              
              const jobData = await page.evaluate((query) => {
                const jobs: any[] = [];
                const jobElements = document.querySelectorAll('.job, .position, .opening, [data-job]');
                
                for (const element of Array.from(jobElements).slice(0, 3)) {
                  const titleEl = element.querySelector('h3, h4, .title, .job-title');
                  const locationEl = element.querySelector('.location, .office');
                  const linkEl = element.querySelector('a');
                  
                  if (titleEl && titleEl.textContent?.toLowerCase().includes(query.toLowerCase())) {
                    jobs.push({
                      title: titleEl.textContent?.trim() || '',
                      company: company.charAt(0).toUpperCase() + company.slice(1),
                      location: locationEl?.textContent?.trim() || 'Remote',
                      description: '',
                      url: linkEl?.href || url,
                      salary: '',
                      postedDate: new Date().toISOString(),
                      source: 'company_careers'
                    });
                  }
                }
                
                return jobs;
              }, searchQuery);
              
              jobs.push(...jobData.map(job => ({ ...job, score: 0 })));
              break; // Found jobs, no need to try other URLs
              
            } catch (urlError) {
              continue; // Try next URL
            }
          }
          
          await browser.close();
          
        } catch (companyError) {
          logger.warn(`Failed to scrape ${company} careers:`, companyError instanceof Error ? companyError.message : String(companyError));
          continue;
        }
      }
      
    } catch (error) {
      logger.warn('Company career pages scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from RSS feeds
   */
  private async scrapeFromJobRSSFeeds(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      // List of job RSS feeds
      const rssFeeds = [
        'https://jobs.github.com/positions.atom',
        'https://remoteok.io/remote-jobs.rss',
        'https://stackoverflow.com/jobs/feed'
      ];
      
      for (const feedUrl of rssFeeds.slice(0, 2)) { // Limit to 2 feeds
        try {
          const response = await fetch(feedUrl);
          if (response.ok) {
            const xmlText = await response.text();
            
            // Simple XML parsing for job titles and companies
            const titleMatches = xmlText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || [];
            const linkMatches = xmlText.match(/<link>(.*?)<\/link>/g) || [];
            
            for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
              const title = titleMatches[i]?.replace(/<title><!\[CDATA\[(.*?)\]\]><\/title>/, '$1') || '';
              const link = linkMatches[i]?.replace(/<link>(.*?)<\/link>/, '$1') || '';
              
              if (title && keywords.some(keyword => title.toLowerCase().includes(keyword.toLowerCase()))) {
                jobs.push({
                  title: title,
                  company: 'Unknown Company',
                  location: 'Remote',
                  description: '',
                  url: link,
                  salary: '',
                  postedDate: new Date(),
                  source: 'rss_feed',
                  score: 0
                });
              }
            }
          }
        } catch (feedError) {
          logger.warn(`Failed to parse RSS feed ${feedUrl}:`, feedError instanceof Error ? feedError.message : String(feedError));
          continue;
        }
      }
      
    } catch (error) {
      logger.warn('RSS feeds scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Get job by ID (helper method)
   */
  private async getJobById(jobId: string): Promise<any> {
    try {
      const { jobApplicationModel } = await import('../models/jobApplication.model');
      return await jobApplicationModel.findById(new mongoose.Types.ObjectId(jobId), new mongoose.Types.ObjectId());
    } catch (error) {
      logger.error('Error getting job by ID:', error);
      return null;
    }
  }

  /**
   * Find similar jobs from existing job applications in the database
   * This is the manual algorithm approach using weighted similarity
   */
  async findSimilarJobsFromDatabase(
    jobApplication: any,
    userId: string,
    searchParams: Partial<IJobSearchParams> = {}
  ): Promise<ISimilarJob[]> {
    try {
      logger.info('Finding similar jobs from database for:', jobApplication.title);
      
      // Import the job model dynamically to avoid circular dependencies
      const { jobApplicationModel } = await import('../models/jobApplication.model');
      
      // Get all job applications for the user (excluding the current one)
      const { jobApplications: allJobs } = await jobApplicationModel.findByUserId(
        new mongoose.Types.ObjectId(userId)
      );
      const otherJobs = allJobs.filter((job: any) => job._id.toString() !== jobApplication._id.toString());
      
      if (otherJobs.length === 0) {
        logger.info('No other jobs found for similarity comparison');
        return [];
      }
      
      logger.info(`Comparing against ${otherJobs.length} other job applications`);
      
      // Calculate similarity scores for each job
      const scoredJobs: ISimilarJob[] = [];
      
      for (const job of otherJobs) {
        const similarityScore = this.calculateJobSimilarity(jobApplication, job);
        
        // Only include jobs with meaningful similarity (score > 0.1)
        if (similarityScore > 0.1) {
          scoredJobs.push({
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location || 'Not specified',
            url: job.url || '',
            salary: job.salary || undefined,
            jobType: job.jobType || undefined,
            experienceLevel: job.experienceLevel || undefined,
            distance: 0, // Not applicable for database jobs
            isRemote: false, // Not applicable for database jobs
            source: 'database',
            postedDate: job.createdAt || new Date(),
            score: similarityScore
          });
        }
      }
      
      // Sort by similarity score (highest first) and apply limit
      const limit = searchParams.limit || 10;
      const sortedJobs = scoredJobs
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);
      
      logger.info(`Found ${sortedJobs.length} similar jobs with scores > 0.1`);
      return sortedJobs;
      
    } catch (error) {
      logger.error('Error finding similar jobs from database:', error);
      return [];
    }
  }

  /**
   * Calculate similarity score between two job applications
   * Uses weighted criteria for manual similarity calculation
   */
  private calculateJobSimilarity(job1: any, job2: any): number {
    const weights = {
      title: 0.4,      // 40% - Job title similarity
      company: 0.2,    // 20% - Company similarity  
      description: 0.2, // 20% - Description similarity
      location: 0.1,   // 10% - Location similarity
      skills: 0.1      // 10% - Skills similarity
    };
    
    let totalScore = 0;
    
    // Title similarity (using keyword matching)
    const titleScore = this.calculateTextSimilarity(job1.title, job2.title);
    totalScore += titleScore * weights.title;
    
    // Company similarity
    const companyScore = this.calculateTextSimilarity(job1.company, job2.company);
    totalScore += companyScore * weights.company;
    
    // Description similarity (using keyword extraction)
    const descriptionScore = this.calculateDescriptionSimilarity(job1.description, job2.description);
    totalScore += descriptionScore * weights.description;
    
    // Location similarity
    const locationScore = this.calculateLocationSimilarity(job1.location, job2.location);
    totalScore += locationScore * weights.location;
    
    // Skills similarity (if available)
    const skillsScore = this.calculateSkillsSimilarity(job1.skills, job2.skills);
    totalScore += skillsScore * weights.skills;
    
    return Math.min(totalScore, 1.0); // Cap at 1.0
  }

  /**
   * Calculate text similarity using keyword matching
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = this.extractKeywords(text1.toLowerCase());
    const words2 = this.extractKeywords(text2.toLowerCase());
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
    
    return text
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => /^[a-zA-Z]+$/.test(word)); // Only alphabetic words
  }

  /**
   * Calculate description similarity using keyword extraction
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    // Extract technical keywords and skills from descriptions
    const keywords1 = this.extractTechnicalKeywords(desc1);
    const keywords2 = this.extractTechnicalKeywords(desc2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const commonKeywords = keywords1.filter(keyword => keywords2.includes(keyword));
    const totalKeywords = new Set([...keywords1, ...keywords2]).size;
    
    return commonKeywords.length / totalKeywords;
  }

  /**
   * Extract technical keywords from job descriptions
   */
  private extractTechnicalKeywords(description: string): string[] {
    const technicalTerms = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'typescript',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'machine learning', 'ai', 'data science', 'analytics',
      'frontend', 'backend', 'full stack', 'devops', 'ci/cd', 'api', 'rest', 'graphql',
      'microservices', 'agile', 'scrum', 'testing', 'tdd', 'bdd', 'git', 'github',
      'linux', 'unix', 'cloud', 'serverless', 'lambda', 'terraform', 'ansible'
    ];
    
    const lowerDesc = description.toLowerCase();
    return technicalTerms.filter(term => lowerDesc.includes(term));
  }

  /**
   * Calculate location similarity
   */
  private calculateLocationSimilarity(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 0;
    
    const loc1Lower = loc1.toLowerCase();
    const loc2Lower = loc2.toLowerCase();
    
    // Exact match
    if (loc1Lower === loc2Lower) return 1.0;
    
    // Same city
    const city1 = loc1Lower.split(',')[0].trim();
    const city2 = loc2Lower.split(',')[0].trim();
    if (city1 === city2) return 0.8;
    
    // Same country/region
    const country1 = loc1Lower.split(',').pop()?.trim();
    const country2 = loc2Lower.split(',').pop()?.trim();
    if (country1 === country2) return 0.5;
    
    // Remote vs non-remote
    const isRemote1 = loc1Lower.includes('remote') || loc1Lower.includes('anywhere');
    const isRemote2 = loc2Lower.includes('remote') || loc2Lower.includes('anywhere');
    if (isRemote1 && isRemote2) return 0.6;
    
    return 0;
  }

  /**
   * Calculate skills similarity
   */
  private calculateSkillsSimilarity(skills1: string[], skills2: string[]): number {
    if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) return 0;
    
    const skills1Lower = skills1.map(s => s.toLowerCase());
    const skills2Lower = skills2.map(s => s.toLowerCase());
    
    const commonSkills = skills1Lower.filter(skill => skills2Lower.includes(skill));
    const totalSkills = new Set([...skills1Lower, ...skills2Lower]).size;
    
    return commonSkills.length / totalSkills;
  }

  /**
   * Scrape a specific job site
   */
  private async scrapeJobSite(
    source: string, 
    params: IJobSearchParams
  ): Promise<IScraperResult> {
    try {
      const config = this.scraperConfigs[source];
      if (!config) {
        throw new Error(`Unknown job source: ${source}`);
      }

      // Build search URL
      const searchUrl = this.buildSearchUrl(config, params);
      logger.info(`Scraping ${source}: ${searchUrl}`);

      // Use Puppeteer for dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Navigate to search page
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to wait for job cards, but don't fail if they don't exist
        try {
          await page.waitForSelector(config.selectors.jobCard, { timeout: 5000 });
        } catch (error) {
          logger.warn(`Job cards not found for ${source}, trying alternative approach`);
        }
        
        // Extract job data
        const jobs = await page.evaluate((selectors) => {
          const jobCards = document.querySelectorAll(selectors.jobCard);
          const jobs: any[] = [];
          
          jobCards.forEach((card: Element) => {
            try {
              // Helper function to find element with multiple selectors
              const findElement = (selectorString: string) => {
                const selectors = selectorString.split(', ');
                for (const selector of selectors) {
                  const element = card.querySelector(selector.trim());
                  if (element) return element;
                }
                return null;
              };
              
              const titleEl = findElement(selectors.title);
              const companyEl = findElement(selectors.company);
              const locationEl = findElement(selectors.location);
              const descriptionEl = findElement(selectors.description);
              const urlEl = findElement(selectors.url);
              const salaryEl = selectors.salary ? findElement(selectors.salary) : null;
              const postedEl = selectors.postedDate ? findElement(selectors.postedDate) : null;
              
              if (titleEl && companyEl) {
                const job: any = {
                  title: (titleEl.textContent || '').trim(),
                  company: (companyEl.textContent || '').trim(),
                  location: (locationEl?.textContent || '').trim(),
                  description: (descriptionEl?.textContent || '').trim(),
                  url: urlEl?.getAttribute('href') || '',
                  salary: salaryEl?.textContent?.trim(),
                  postedDate: postedEl?.textContent?.trim(),
                  source: source
                };
                
                // Make URL absolute if it's relative
                if (job.url && !job.url.startsWith('http')) {
                  job.url = new URL(job.url, window.location.origin).href;
                }
                
                jobs.push(job);
              }
            } catch (error) {
              console.error('Error parsing job card:', error);
            }
          });
          
          return jobs;
        }, config.selectors);
        
        await browser.close();
        
        // Process and validate jobs
        const processedJobs = jobs
          .filter(job => job.title && job.company)
          .map(job => this.processJobData(job, source));
        
        logger.info(`Scraped ${processedJobs.length} jobs from ${source}`);
        
        return {
          jobs: processedJobs,
          hasMore: false, // Simplified for now
          nextPageUrl: undefined
        };
        
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.error(`Error scraping ${source}:`, error);
      return {
        jobs: [],
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build search URL for a job site
   */
  private buildSearchUrl(config: IScraperConfig, params: IJobSearchParams): string {
    const url = new URL(config.searchPath, config.baseUrl);
    
    // Add search parameters based on the site
    if (config.baseUrl.includes('indeed.com')) {
      url.searchParams.set('q', params.title);
      if (params.location) {
        url.searchParams.set('l', params.location);
      }
      if (params.remote) {
        url.searchParams.set('sc', '0kf%3Aattr%28DSQF7%29%3B'); // Remote filter
      }
    } else if (config.baseUrl.includes('linkedin.com')) {
      url.searchParams.set('keywords', params.title);
      if (params.location) {
        url.searchParams.set('location', params.location);
      }
      if (params.remote) {
        url.searchParams.set('f_WT', '2'); // Remote filter
      }
    } else if (config.baseUrl.includes('glassdoor.com')) {
      url.searchParams.set('sc.keyword', params.title);
      if (params.location) {
        url.searchParams.set('locT', 'C');
        url.searchParams.set('locId', params.location);
      }
    }
    
    return url.toString();
  }

  /**
   * Process raw job data from scraping
   */
  private processJobData(rawJob: any, source: string): ISimilarJob {
    return {
      title: rawJob.title,
      company: rawJob.company,
      description: rawJob.description,
      location: rawJob.location,
      url: rawJob.url,
      salary: rawJob.salary,
      jobType: this.extractJobType(rawJob.title, rawJob.description),
      experienceLevel: this.extractExperienceLevel(rawJob.title, rawJob.description),
      source: source as any,
      postedDate: rawJob.postedDate ? new Date(rawJob.postedDate) : undefined
    };
  }

  /**
   * Extract job type from title and description
   */
  private extractJobType(title: string, description: string): string | undefined {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('full-time') || text.includes('full time')) return 'full-time';
    if (text.includes('part-time') || text.includes('part time')) return 'part-time';
    if (text.includes('contract')) return 'contract';
    if (text.includes('internship')) return 'internship';
    if (text.includes('remote') || text.includes('work from home')) return 'remote';
    
    return undefined;
  }

  /**
   * Extract experience level from title and description
   */
  private extractExperienceLevel(title: string, description: string): string | undefined {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('sr.')) return 'senior';
    if (text.includes('lead') || text.includes('principal')) return 'lead';
    if (text.includes('executive') || text.includes('director')) return 'executive';
    if (text.includes('entry') || text.includes('junior') || text.includes('jr.')) return 'entry';
    if (text.includes('mid') || text.includes('intermediate')) return 'mid';
    
    return undefined;
  }

  /**
   * Remove duplicate jobs based on title and company
   */
  private removeDuplicateJobs(jobs: ISimilarJob[]): ISimilarJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Calculate similarity scores for jobs
   */
  private async calculateSimilarityScores(
    jobs: ISimilarJob[], 
    originalJob: any
  ): Promise<IJobSimilarityScore[]> {
    const scoredJobs: IJobSimilarityScore[] = [];
    
    for (const job of jobs) {
      let score = 0;
      const reasons: string[] = [];
      
      // Title similarity (40% weight)
      const titleSimilarity = this.calculateTextSimilarity(
        originalJob.title.toLowerCase(),
        job.title.toLowerCase()
      );
      score += titleSimilarity * 0.4;
      if (titleSimilarity > 0.7) {
        reasons.push('Similar job title');
      }
      
      // Company similarity (20% weight)
      const companySimilarity = this.calculateTextSimilarity(
        originalJob.company.toLowerCase(),
        job.company.toLowerCase()
      );
      score += companySimilarity * 0.2;
      if (companySimilarity > 0.8) {
        reasons.push('Same company');
      }
      
      // Location proximity (20% weight)
      if (originalJob.location && job.location) {
        const locationScore = await this.calculateLocationScore(
          originalJob.location,
          job.location
        );
        score += locationScore * 0.2;
        if (locationScore > 0.7) {
          reasons.push('Nearby location');
        }
      }
      
      // Job type match (10% weight)
      if (originalJob.jobType && job.jobType && originalJob.jobType === job.jobType) {
        score += 0.1;
        reasons.push('Same job type');
      }
      
      // Experience level match (10% weight)
      if (originalJob.experienceLevel && job.experienceLevel && 
          originalJob.experienceLevel === job.experienceLevel) {
        score += 0.1;
        reasons.push('Same experience level');
      }
      
      scoredJobs.push({
        job,
        score: Math.round(score * 100) / 100,
        reasons
      });
    }
    
    return scoredJobs;
  }

  /**
   * Calculate location score based on proximity
   */
  private async calculateLocationScore(
    location1: string, 
    location2: string
  ): Promise<number> {
    try {
      // Check if either location is remote
      const parsed1 = LocationUtils.parseLocationString(location1);
      const parsed2 = LocationUtils.parseLocationString(location2);
      
      if (parsed1.isRemote && parsed2.isRemote) {
        return 1.0; // Both remote
      }
      
      if (parsed1.isRemote || parsed2.isRemote) {
        return 0.5; // One remote
      }
      
      // Geocode both locations and calculate distance
      const coords1 = await LocationUtils.geocodeAddress(location1);
      const coords2 = await LocationUtils.geocodeAddress(location2);
      
      if (!coords1 || !coords2) {
        return 0.3; // Default score if geocoding fails
      }
      
      const distance = LocationUtils.calculateDistance(
        coords1.latitude,
        coords1.longitude,
        coords2.latitude,
        coords2.longitude
      );
      
      // Convert distance to score (closer = higher score)
      if (distance <= 10) return 1.0;
      if (distance <= 25) return 0.8;
      if (distance <= 50) return 0.6;
      if (distance <= 100) return 0.4;
      
      return 0.2;
      
    } catch (error) {
      logger.error('Error calculating location score:', error);
      return 0.3;
    }
  }

  /**
   * Scrape job details from a specific URL
   */
  async scrapeJobDetails(url: string): Promise<Partial<ISimilarJob> | null> {
    try {
      logger.info(`Scraping job details from: ${url}`);
      
      // Use Puppeteer for better handling of dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the job posting
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract job details using multiple strategies
        const jobDetails = await page.evaluate(() => {
          // Common selectors for different job sites
          const selectors = {
            title: [
              'h1[data-testid="job-title"]',
              'h1.job-title',
              'h1.jobTitle',
              '.job-title h1',
              'h1',
              '[data-testid="job-title"]',
              '.jobsearch-JobInfoHeader-title',
              '.job-details h1',
              '.job-header h1',
              '.position-title',
              '.job-title-text',
              'h2.job-title',
              '.title'
            ],
            company: [
              '.company-name',
              '.companyName',
              '.employer',
              '[data-testid="company-name"]',
              '.jobsearch-CompanyInfoContainer',
              '.company',
              '.employer-name',
              '.job-company',
              '.company-info',
              '.organization',
              '.company-title'
            ],
            location: [
              '.location',
              '.job-location',
              '.companyLocation',
              '[data-testid="job-location"]',
              '.jobsearch-JobInfoHeader-subtitle',
              '.job-location',
              '.job-details .location',
              '.workplace',
              '.office-location',
              '.work-location'
            ],
            description: [
              '.job-description',
              '.jobDescription',
              '.description',
              '[data-testid="job-description"]',
              '.jobsearch-jobDescriptionText',
              '.job-description-content',
              '.job-details',
              '.job-content',
              '.description-content',
              '.job-summary',
              '.position-description',
              '.role-description',
              'main',
              '.content'
            ],
            salary: [
              '.salary',
              '.salaryText',
              '.compensation',
              '[data-testid="salary"]',
              '.jobsearch-JobMetadataHeader-item',
              '.salary-range',
              '.pay',
              '.wage',
              '.compensation-range'
            ]
          };

          const extractText = (selectors: string[]): string => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          let title = extractText(selectors.title);
          let company = extractText(selectors.company);
          const location = extractText(selectors.location);
          const description = extractText(selectors.description);
          const salary = extractText(selectors.salary);

          // If we didn't find title or company, try more generic approaches
          if (!title) {
            const h1 = document.querySelector('h1');
            if (h1) title = h1.textContent?.trim() || '';
            
            // Try h2, h3 as fallback
            if (!title) {
              const h2 = document.querySelector('h2');
              if (h2) title = h2.textContent?.trim() || '';
            }
            
            // Extract from URL as last resort
            if (!title) {
              const url = window.location.href;
              if (url.includes('trulioo.com')) {
                title = 'Trulioo Job Position';
              } else if (url.includes('amazon.jobs')) {
                title = 'Amazon Job Position';
              } else if (url.includes('indeed.com')) {
                title = 'Indeed Job Posting';
              } else if (url.includes('linkedin.com')) {
                title = 'LinkedIn Job Posting';
              } else {
                title = 'Job Position';
              }
            }
          }

          if (!company) {
            // Look for company in meta tags
            const companyMeta = document.querySelector('meta[property="og:site_name"], meta[name="application-name"]');
            if (companyMeta) company = companyMeta.getAttribute('content') || '';
            
            // Extract from URL as fallback
            if (!company) {
              const url = window.location.href;
              if (url.includes('trulioo.com')) {
                company = 'Trulioo';
              } else if (url.includes('amazon.jobs')) {
                company = 'Amazon';
              } else if (url.includes('indeed.com')) {
                company = 'Company on Indeed';
              } else if (url.includes('linkedin.com')) {
                company = 'Company on LinkedIn';
              } else {
                company = 'Company';
              }
            }
          }

          // Clean up the description (remove extra whitespace)
          const cleanDescription = description.replace(/\s+/g, ' ').trim();

          return {
            title,
            company,
            location,
            description: cleanDescription,
            salary,
            url: window.location.href
          };
        });

        await browser.close();

        // Validate that we got essential information
        if (!jobDetails.title || !jobDetails.company) {
          logger.warn('Insufficient job details extracted:', jobDetails);
          return null;
        }

        // Extract additional metadata
        const jobType = this.extractJobType(jobDetails.title, jobDetails.description);
        const experienceLevel = this.extractExperienceLevel(jobDetails.title, jobDetails.description);

        const result = {
          title: jobDetails.title,
          company: jobDetails.company,
          location: jobDetails.location || undefined,
          description: jobDetails.description,
          salary: jobDetails.salary || undefined,
          url: jobDetails.url,
          jobType,
          experienceLevel
        };

        logger.info('Successfully scraped job details:', { title: result.title, company: result.company });
        return result;

      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.error('Error scraping job details:', error);
      return null;
    }
  }

}

export const jobSearchService = new JobSearchService();

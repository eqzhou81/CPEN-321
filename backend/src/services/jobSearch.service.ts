import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import { availableJobModel } from '../models/availableJob.model';
import {
  IJobSearchParams,
  IJobSimilarityScore,
  IScraperConfig,
  IScraperResult,
  ISimilarJob
} from '../types/jobs.types';
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
   * Find similar jobs using database-first approach
   */
  async findSimilarJobs(
    jobId: string,
    userId: string,
    limit: number = 5
  ): Promise<ISimilarJob[]> {
    try {
      // Get the original job to extract keywords
      const jobApplication = await this.getJobById(jobId, userId);
      if (!jobApplication) {
        throw new Error('Job not found');
      }

      logger.info(`Finding similar jobs for: ${jobApplication.title} at ${jobApplication.company}`);

      // Extract search keywords from the original job
      const searchKeywords = this.extractSearchKeywords(jobApplication);
      logger.info(`Extracted keywords: ${searchKeywords.join(', ')}`);

      // Search for similar jobs from our database only
      const databaseJobs = await this.findSimilarJobsFromDatabase(jobApplication, limit);

      if (databaseJobs.length > 0) {
        logger.info(`Found ${databaseJobs.length} similar jobs from database`);
        return databaseJobs.slice(0, limit);
      }

      // No results found in database
      logger.warn('No similar jobs found in database');
      return [];

    } catch (error) {
      logger.error('Error in findSimilarJobs:', error);
      return [];
    }
  }

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
   * Scrape jobs from unprotected sites with robust timeout handling
   * Targets sites with minimal anti-bot protection for reliable results
   */
  private async scrapeJobsFromUnprotectedSites(
    searchKeywords: string[],
    limit: number
  ): Promise<ISimilarJob[]> {
    const similarJobs: ISimilarJob[] = [];

    try {
      logger.info(`Starting web scraping with keywords: ${searchKeywords.join(', ')}`);
      
      // Define scraping sources with individual timeouts
      const scrapingSources = [
        { name: 'GitHub Jobs', fn: () => this.scrapeFromGitHubJobs(searchKeywords) },
        { name: 'RemoteOK', fn: () => this.scrapeFromRemoteOK(searchKeywords) },
        { name: 'Stack Overflow Jobs', fn: () => this.scrapeFromStackOverflowJobs(searchKeywords) },
        { name: 'Company Career Pages', fn: () => this.scrapeFromCompanyCareerPages(searchKeywords) },
        { name: 'Job RSS Feeds', fn: () => this.scrapeFromJobRSSFeeds(searchKeywords) }
      ];

      // Execute scraping sources in parallel with individual timeouts
      const scrapingPromises = scrapingSources.map(source => 
        Promise.race([
          source.fn(),
          new Promise<ISimilarJob[]>((_, reject) => 
            setTimeout(() => reject(new Error(`${source.name} timeout`)), 15000) // 15 second timeout per source
          )
        ]).catch(error => {
          logger.warn(`Failed to scrape from ${source.name}: ${error.message}`);
          return [];
        })
      );

      const results = await Promise.allSettled(scrapingPromises);
      
      // Combine results from all sources
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          similarJobs.push(...result.value);
          logger.info(`Found ${result.value.length} jobs from ${scrapingSources[index].name}`);
        }
      });

      // Calculate similarity scores and filter
      const scoredJobs = similarJobs.map(job => {
        const similarityScore = this.calculateWebJobSimilarity(searchKeywords, job);
        return {
          ...job,
          score: similarityScore
        };
      });

      // Filter by similarity threshold and sort by score
      const filteredJobs = scoredJobs
        .filter(job => job.score > 0.2) // Only jobs with decent similarity
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);

      logger.info(`Returning ${filteredJobs.length} similar jobs with scores: ${filteredJobs.map(j => j.score?.toFixed(2)).join(', ')}`);
      return filteredJobs;

    } catch (error) {
      logger.error('Error in scrapeJobsFromUnprotectedSites:', error);
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
   * Calculate similarity score for web-scraped jobs using manual algorithm
   */
  private calculateWebJobSimilarity(searchKeywords: string[], job: ISimilarJob): number {
    let score = 0;
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    const description = job.description.toLowerCase();
    
    // Title similarity (40% weight)
    const titleMatches = searchKeywords.filter(keyword => 
      title.includes(keyword.toLowerCase())
    ).length;
    score += (titleMatches / searchKeywords.length) * 0.4;
    
    // Company similarity (20% weight) - bonus for same company
    if (searchKeywords.some(keyword => company.includes(keyword.toLowerCase()))) {
      score += 0.2;
    }
    
    // Description similarity (30% weight)
    const descMatches = searchKeywords.filter(keyword => 
      description.includes(keyword.toLowerCase())
    ).length;
    score += (descMatches / searchKeywords.length) * 0.3;
    
    // Location bonus (10% weight)
    if (job.location && job.location.toLowerCase().includes('remote')) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Scrape jobs from Indeed
   */
  private async scrapeFromIndeed(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      const searchQuery = keywords.slice(0, 2).join(' ');
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      try {
        await page.goto(`https://ca.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=`, {
          waitUntil: 'networkidle2',
          timeout: 15000
        });
        
        const jobData = await page.evaluate(() => {
          const jobs: any[] = [];
          const jobCards = document.querySelectorAll('[data-jk], .job_seen_beacon, .jobsearch-SerpJobCard');
          
          for (const card of Array.from(jobCards).slice(0, 5)) {
            const titleEl = card.querySelector('h2.jobTitle a span[title], h2.jobTitle a, .jobTitle a span, .jobTitle a');
            const companyEl = card.querySelector('.companyName, .company, [data-testid="company-name"]');
            const locationEl = card.querySelector('.companyLocation, .location, [data-testid="job-location"]');
            const linkEl = card.querySelector('h2.jobTitle a, .jobTitle a, a[data-jk]');
            
            if (titleEl && companyEl) {
              jobs.push({
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim() || '',
                location: locationEl?.textContent?.trim() || 'Not specified',
                description: '',
                url: (linkEl as HTMLAnchorElement)?.href || '',
                salary: '',
                postedDate: new Date(),
                source: 'indeed'
              });
            }
          }
          
          return jobs;
        });
        
        jobs.push(...jobData.map(job => ({ ...job, score: 0 })));
        logger.info(`Scraped ${jobs.length} jobs from Indeed`);
        
      } catch (pageError) {
        logger.warn('Indeed page scraping failed:', pageError instanceof Error ? pageError.message : String(pageError));
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.warn('Indeed scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from LinkedIn
   */
  private async scrapeFromLinkedIn(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      const searchQuery = keywords.slice(0, 2).join(' ');
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      try {
        await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}`, {
          waitUntil: 'networkidle2',
          timeout: 15000
        });
        
        const jobData = await page.evaluate(() => {
          const jobs: any[] = [];
          const jobCards = document.querySelectorAll('.jobs-search-results__list-item, .job-search-card, [data-job-id]');
          
          for (const card of Array.from(jobCards).slice(0, 5)) {
            const titleEl = card.querySelector('.job-search-card__title a, .job-title a, h3 a');
            const companyEl = card.querySelector('.job-search-card__subtitle-link, .job-search-card__company-name, .company-name');
            const locationEl = card.querySelector('.job-search-card__location, .job-location, .location');
            const linkEl = card.querySelector('.job-search-card__title a, .job-title a, h3 a');
            
            if (titleEl && companyEl) {
              jobs.push({
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim() || '',
                location: locationEl?.textContent?.trim() || 'Not specified',
                description: '',
                url: (linkEl as HTMLAnchorElement)?.href || '',
                salary: '',
                postedDate: new Date(),
                source: 'linkedin'
              });
            }
          }
          
          return jobs;
        });
        
        jobs.push(...jobData.map(job => ({ ...job, score: 0 })));
        logger.info(`Scraped ${jobs.length} jobs from LinkedIn`);
        
      } catch (pageError) {
        logger.warn('LinkedIn page scraping failed:', pageError instanceof Error ? pageError.message : String(pageError));
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.warn('LinkedIn scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from Glassdoor
   */
  private async scrapeFromGlassdoor(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      const searchQuery = keywords.slice(0, 2).join(' ');
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      try {
        await page.goto(`https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=${encodeURIComponent(searchQuery)}`, {
          waitUntil: 'networkidle2',
          timeout: 15000
        });
        
        const jobData = await page.evaluate(() => {
          const jobs: any[] = [];
          const jobCards = document.querySelectorAll('[data-test="job-listing"], .jobContainer, .jobListing');
          
          for (const card of Array.from(jobCards).slice(0, 5)) {
            const titleEl = card.querySelector('[data-test="job-title"], .jobTitle, h3');
            const companyEl = card.querySelector('[data-test="employer-name"], .employerName, .company');
            const locationEl = card.querySelector('[data-test="job-location"], .location, .jobLocation');
            const linkEl = card.querySelector('a');
            
            if (titleEl && companyEl) {
              jobs.push({
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim() || '',
                location: locationEl?.textContent?.trim() || 'Not specified',
                description: '',
                url: (linkEl as HTMLAnchorElement)?.href || '',
                salary: '',
                postedDate: new Date(),
                source: 'glassdoor'
              });
            }
          }
          
          return jobs;
        });
        
        jobs.push(...jobData.map(job => ({ ...job, score: 0 })));
        logger.info(`Scraped ${jobs.length} jobs from Glassdoor`);
        
      } catch (pageError) {
        logger.warn('Glassdoor page scraping failed:', pageError instanceof Error ? pageError.message : String(pageError));
      } finally {
        await browser.close();
      }
      
    } catch (error) {
      logger.warn('Glassdoor scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from GitHub Jobs API (unprotected, simple structure)
   */
  private async scrapeFromGitHubJobs(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      logger.info('Scraping from GitHub Jobs...');
      const searchQuery = keywords.join(' ');
      const url = `https://jobs.github.com/positions.json?search=${encodeURIComponent(searchQuery)}&page=0`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        
        for (const job of data.slice(0, 10)) {
          jobs.push({
            title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description || '',
            url: job.url || '',
            salary: job.salary || '',
            postedDate: new Date(job.created_at),
            source: 'github_jobs',
            jobType: this.extractJobType(job.title, job.description),
            experienceLevel: this.extractExperienceLevel(job.title, job.description)
          });
        }
        
        logger.info(`Found ${jobs.length} jobs from GitHub Jobs`);
      }
    } catch (error) {
      logger.warn('GitHub Jobs scraping failed:', error instanceof Error ? error.message : String(error));
    }
    
    return jobs;
  }

  /**
   * Scrape jobs from RemoteOK (unprotected, simple structure)
   */
  private async scrapeFromRemoteOK(keywords: string[]): Promise<ISimilarJob[]> {
    const jobs: ISimilarJob[] = [];
    
    try {
      logger.info('Scraping from RemoteOK...');
      const searchQuery = keywords.join(' ');
      
      // Try RemoteOK API first (simpler and faster)
      const response = await fetch(`https://remoteok.io/api?tags=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        
        for (const job of data.slice(1, 11)) { // Skip first element (metadata)
          if (job.position && job.company) {
            jobs.push({
              title: job.position,
              company: job.company,
              location: 'Remote',
              description: job.description || '',
              url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
              salary: job.salary || '',
              postedDate: new Date(job.date),
              source: 'remoteok',
              isRemote: true,
              jobType: this.extractJobType(job.position, job.description),
              experienceLevel: this.extractExperienceLevel(job.position, job.description)
            });
          }
        }
        
        logger.info(`Found ${jobs.length} jobs from RemoteOK`);
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
                url: (linkEl as HTMLAnchorElement)?.href || '',
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
  private async getJobById(jobId: string, userId: string): Promise<any> {
    try {
      const { jobApplicationModel } = await import('../models/jobApplication.model');
      return await jobApplicationModel.findById(new mongoose.Types.ObjectId(jobId), new mongoose.Types.ObjectId(userId));
    } catch (error) {
      logger.error('Error getting job by ID:', error);
      return null;
    }
  }

  /**
   * Find similar jobs from our available jobs database
   * This searches the pre-populated Amazon/Microsoft Vancouver jobs
   */
  async findSimilarJobsFromDatabase(
    jobApplication: any,
    limit: number = 5
  ): Promise<ISimilarJob[]> {
    try {
      logger.info('Finding similar jobs for:', jobApplication.title);
      
      // Get all available jobs (with reasonable limit)
      const availableJobs = await this.fetchCandidateJobs(jobApplication);
      
      if (availableJobs.length === 0) {
        logger.warn('No jobs found in database');
        return [];
      }
      
      logger.info(`Scoring ${availableJobs.length} candidate jobs`);
      
      // Score and filter jobs
      const scoredJobs = availableJobs
        .map(job => ({
          ...this.convertToSimilarJob(job),
          score: this.calculateJobSimilarity(jobApplication, job)
        }))
        .filter(job => job.score > 0.1) // Minimum meaningful similarity
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      logger.info(`Returning ${scoredJobs.length} similar jobs (scores: ${scoredJobs.map(j => j.score.toFixed(2)).join(', ')})`);
      return scoredJobs;
      
    } catch (error) {
      logger.error('Error finding similar jobs:', error);
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
    const titleScore = this.compareTitles(job1.title, job2.title);
    totalScore += titleScore * weights.title;
    
    // Company similarity
    const companyScore = this.compareCompanies(job1.company, job2.company);
    totalScore += companyScore * weights.company;
    
    // Description similarity (using keyword extraction)
    const descriptionScore = this.compareDescriptions(job1.description, job2.description);
    totalScore += descriptionScore * weights.description;
    
    // Location similarity
    const locationScore = this.compareLocations(job1.location, job2.location);
    totalScore += locationScore * weights.location;
    
    // Skills similarity (if available)
    const skillsScore = this.compareSkills(job1.skills, job2.skills);
    totalScore += skillsScore * weights.skills;
    
    return Math.min(totalScore, 1.0); // Cap at 1.0
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

  /**
   * Scrape jobs from Stack Overflow Jobs (developer-focused, less protection)
   */
  private async scrapeFromStackOverflowJobs(searchKeywords: string[]): Promise<ISimilarJob[]> {
    try {
      logger.info('Scraping from Stack Overflow Jobs...');
      const jobs: ISimilarJob[] = [];
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; JobBot/1.0)');
      
      const searchQuery = searchKeywords.join(' ');
      const url = `https://stackoverflow.com/jobs?q=${encodeURIComponent(searchQuery)}`;
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const stackJobs = await page.evaluate(() => {
        const jobs: any[] = [];
        const jobElements = document.querySelectorAll('.job-summary');
        
        for (let i = 0; i < Math.min(jobElements.length, 10); i++) {
          const jobEl = jobElements[i];
          const titleEl = jobEl.querySelector('h2 a');
          const companyEl = jobEl.querySelector('.company');
          const locationEl = jobEl.querySelector('.location');
          const descriptionEl = jobEl.querySelector('.job-summary-content');
          
          if (titleEl) {
            jobs.push({
              title: titleEl.textContent?.trim() || '',
              company: companyEl?.textContent?.trim() || 'Company',
              location: locationEl?.textContent?.trim() || 'Location not specified',
              description: descriptionEl?.textContent?.trim() || '',
              url: `https://stackoverflow.com${titleEl.getAttribute('href')}`
            });
          }
        }
        
        return jobs;
      });
      
      await browser.close();
      
      for (const job of stackJobs) {
        jobs.push({
          ...job,
          source: 'other',
          jobType: this.extractJobType(job.title, job.description),
          experienceLevel: this.extractExperienceLevel(job.title, job.description)
        });
      }
      
      logger.info(`Found ${jobs.length} jobs from Stack Overflow Jobs`);
      return jobs;
      
    } catch (error) {
      logger.warn('Failed to scrape Stack Overflow Jobs:', error);
      return [];
    }
  }

  /**
   * Extract main title from job title (remove extra details)
   */
  private extractMainTitle(title: string): string {
    // Remove common suffixes and extra details
    const cleanTitle = title
      .split(',')[0] // Take only the first part before comma
      .split(' - ')[0] // Take only the first part before dash
      .split(' at ')[0] // Remove "at company" part
      .trim();
    
    // Extract key words for better matching
    const words = cleanTitle.toLowerCase().split(' ');
    const keyWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with'].includes(word)
    );
    
    return keyWords.join(' ');
  }

  /**
   * Extract main company name from company string
   */
  private extractMainCompany(company: string): string {
    // Remove common suffixes and domains
    const cleanCompany = company
      .split('.')[0] // Remove domain extensions like .jobs, .com
      .split(',')[0] // Take only the first part before comma
      .split(' - ')[0] // Take only the first part before dash
      .split(' at ')[0] // Remove "at company" part
      .trim();
    
    // Convert to lowercase for case-insensitive matching
    const normalizedCompany = cleanCompany.toLowerCase();
    
    // Handle common company name variations
    if (normalizedCompany.includes('amazon')) {
      return 'amazon';
    }
    if (normalizedCompany.includes('microsoft')) {
      return 'microsoft';
    }
    if (normalizedCompany.includes('google')) {
      return 'google';
    }
    
    return normalizedCompany;
  }

  /**
   * Fetch candidate jobs from database using smart search strategy
   */
  private async fetchCandidateJobs(jobApplication: any): Promise<any[]> {
    const searches = [];
    
    // Extract search terms
    const titleKeywords = this.extractMainKeywords(jobApplication.title);
    const companyName = this.normalizeCompanyName(jobApplication.company);
    const location = this.normalizeLocation(jobApplication.jobLocation || jobApplication.location);
    
    // Strategy 1: Search by job title keywords
    if (titleKeywords) {
      searches.push(
        availableJobModel.searchJobs({ title: titleKeywords, limit: 100 })
      );
    }
    
    // Strategy 2: Search by company
    if (companyName) {
      searches.push(
        availableJobModel.searchJobs({ company: companyName, limit: 100 })
      );
    }
    
    // Strategy 3: Search by location
    if (location) {
      searches.push(
        availableJobModel.searchJobs({ location: location, limit: 100 })
      );
    }
    
    // Execute all searches in parallel
    const results = await Promise.all(searches);
    
    // Combine and deduplicate
    const allJobs = results.flat();
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job._id.toString(), job])).values()
    );
    
    return uniqueJobs;
  }

  /**
   * Convert database job to ISimilarJob format
   */
  private convertToSimilarJob(job: any): ISimilarJob {
    return {
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.jobLocation,
      url: job.url,
      salary: job.salary || undefined,
      jobType: job.jobType || undefined,
      experienceLevel: job.experienceLevel || undefined,
      source: 'database',
      score: 0, // Will be set later
      postedDate: job.postedDate || job.createdAt
    };
  }

  /**
   * Compare job titles with role-specific matching
   */
  private compareTitles(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    
    const t1 = this.normalizeTitle(title1);
    const t2 = this.normalizeTitle(title2);
    
    // Exact match
    if (t1 === t2) return 1.0;
    
    // Extract role type (engineer, developer, manager, etc.)
    const role1 = this.extractRole(t1);
    const role2 = this.extractRole(t2);
    
    // Same role type gets high score
    if (role1 && role2 && role1 === role2) {
      return 0.8;
    }
    
    // Calculate keyword overlap
    return this.calculateTextSimilarity(t1, t2);
  }

  /**
   * Compare companies
   */
  private compareCompanies(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;
    
    const c1 = this.normalizeCompanyName(company1);
    const c2 = this.normalizeCompanyName(company2);
    
    return c1 === c2 ? 1.0 : 0;
  }

  /**
   * Compare job descriptions using technical keyword matching
   */
  private compareDescriptions(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    const keywords1 = this.extractTechnicalKeywords(desc1);
    const keywords2 = this.extractTechnicalKeywords(desc2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    const totalKeywords = new Set([...keywords1, ...keywords2]).size;
    
    return commonKeywords.length / totalKeywords;
  }

  /**
   * Compare locations
   */
  private compareLocations(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 0;
    
    const l1 = this.normalizeLocation(loc1);
    const l2 = this.normalizeLocation(loc2);
    
    // Exact match
    if (l1 === l2) return 1.0;
    
    // Check for remote
    const isRemote1 = l1.includes('remote');
    const isRemote2 = l2.includes('remote');
    if (isRemote1 && isRemote2) return 0.9;
    
    // Same city
    const city1 = l1.split(',')[0].trim();
    const city2 = l2.split(',')[0].trim();
    if (city1 === city2) return 0.8;
    
    // Same region/country
    if (l1.includes('vancouver') && l2.includes('vancouver')) return 0.7;
    if (l1.includes('canada') && l2.includes('canada')) return 0.5;
    
    return 0;
  }

  /**
   * Compare skills arrays
   */
  private compareSkills(skills1: string[], skills2: string[]): number {
    if (!skills1?.length || !skills2?.length) return 0;
    
    const s1 = new Set(skills1.map(s => s.toLowerCase()));
    const s2 = new Set(skills2.map(s => s.toLowerCase()));
    
    const intersection = [...s1].filter(s => s2.has(s)).length;
    const union = new Set([...s1, ...s2]).size;
    
    return intersection / union;
  }

  /**
   * Normalize job title
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/\b(sr|senior|jr|junior)\b\.?/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract role from job title
   */
  private extractRole(title: string): string | null {
    const roles = [
      'engineer', 'developer', 'programmer', 'architect',
      'manager', 'director', 'lead', 'principal',
      'analyst', 'scientist', 'designer', 'researcher'
    ];
    
    const titleLower = title.toLowerCase();
    return roles.find(role => titleLower.includes(role)) || null;
  }

  /**
   * Extract main keywords from title (for search)
   */
  private extractMainKeywords(title: string): string {
    const normalized = this.normalizeTitle(title);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'at', 'in', 'for']);
    
    return normalized
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 3) // First 3 meaningful words
      .join(' ');
  }

  /**
   * Normalize location
   */
  private normalizeLocation(location: string): string {
    if (!location) return '';
    
    return location
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize company name
   */
  private normalizeCompanyName(company: string): string {
    if (!company) return '';
    
    return company
      .toLowerCase()
      .replace(/\b(inc|corp|ltd|llc|limited)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Extract technical keywords from description
   */
  private extractTechnicalKeywords(description: string): string[] {
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'html', 'css', 'sass', 'tailwind', 'webpack',
      'node', 'express', 'django', 'flask', 'spring', 'asp.net',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'dynamodb', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
      'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'git', 'linux',
      'machine learning', 'ai', 'data science', 'analytics', 'testing', 'security'
    ];
    
    const descLower = description.toLowerCase();
    return techKeywords.filter(keyword => descLower.includes(keyword));
  }

  /**
   * Calculate text similarity using Jaccard coefficient
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return intersection / union;
  }

}

export const jobSearchService = new JobSearchService();

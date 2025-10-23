import axios from 'axios';
import * as cheerio from 'cheerio';
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
        jobCard: '.job_seen_beacon',
        title: 'h2.jobTitle a span[title]',
        company: '.companyName',
        location: '.companyLocation',
        description: '.job-snippet',
        url: 'h2.jobTitle a',
        salary: '.salary-snippet',
        postedDate: '.date'
      },
      pagination: {
        nextButton: 'a[aria-label="Next Page"]',
        maxPages: 5
      }
    },
    linkedin: {
      baseUrl: 'https://www.linkedin.com',
      searchPath: '/jobs/search',
      selectors: {
        jobCard: '.jobs-search-results__list-item',
        title: '.job-search-card__title a',
        company: '.job-search-card__subtitle-link',
        location: '.job-search-card__location',
        description: '.job-search-card__snippet',
        url: '.job-search-card__title a',
        salary: '.job-search-card__salary',
        postedDate: 'time'
      },
      pagination: {
        nextButton: 'button[aria-label="Next"]',
        maxPages: 3
      }
    },
    glassdoor: {
      baseUrl: 'https://www.glassdoor.com',
      searchPath: '/Job/jobs.htm',
      selectors: {
        jobCard: '.react-job-listing',
        title: '.jobLink',
        company: '.jobInfoItem .employerName',
        location: '.jobInfoItem .loc',
        description: '.jobDescriptionContent',
        url: '.jobLink',
        salary: '.salaryText',
        postedDate: '.jobAge'
      },
      pagination: {
        nextButton: '.nextButton',
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

      // First, try to find similar jobs from our database
      const databaseJobs = await this.findSimilarJobsFromDatabase(jobApplication, limit);

      if (databaseJobs.length > 0) {
        logger.info(`Found ${databaseJobs.length} similar jobs from database`);
        return databaseJobs.slice(0, limit);
      }

      // If no database results, fall back to web scraping
      logger.info('No database results found, falling back to web scraping...');
      const scrapedJobs = await this.scrapeJobsFromUnprotectedSites(searchKeywords, limit);

      if (scrapedJobs.length > 0) {
        logger.info(`Found ${scrapedJobs.length} similar jobs from web scraping`);
        return scrapedJobs.slice(0, limit);
      }

      logger.warn('No similar jobs found from any source');
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

      // Search multiple job sites in parallel
      const searchPromises = Object.keys(this.scraperConfigs).map(source =>
        this.scrapeJobSite(source, params)
      );

      const results = await Promise.allSettled(searchPromises);
      
      // Combine results from all sources
      let allJobs: ISimilarJob[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.jobs) {
          allJobs = allJobs.concat(result.value.jobs);
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
        
        // Wait for job cards to load
        await page.waitForSelector(config.selectors.jobCard, { timeout: 10000 });
        
        // Extract job data
        const jobs = await page.evaluate((selectors) => {
          const jobCards = document.querySelectorAll(selectors.jobCard);
          const jobs: any[] = [];
          
          jobCards.forEach((card: Element) => {
            try {
              const titleEl = card.querySelector(selectors.title);
              const companyEl = card.querySelector(selectors.company);
              const locationEl = card.querySelector(selectors.location);
              const descriptionEl = card.querySelector(selectors.description);
              const urlEl = card.querySelector(selectors.url);
              const salaryEl = selectors.salary ? card.querySelector(selectors.salary) : null;
              const postedEl = selectors.postedDate ? card.querySelector(selectors.postedDate) : null;
              
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
   * Calculate text similarity using simple word overlap
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
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
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Try to extract job details using common selectors
      const title = $('h1, .job-title, .jobTitle').first().text().trim();
      const company = $('.company-name, .companyName, .employer').first().text().trim();
      const location = $('.location, .job-location, .companyLocation').first().text().trim();
      const description = $('.job-description, .jobDescription, .description').first().text().trim();
      const salary = $('.salary, .salaryText, .compensation').first().text().trim();
      
      if (!title || !company) {
        return null;
      }

          return {
            title,
            company,
            location,
        description,
            salary,
        url,
        jobType: this.extractJobType(title, description),
        experienceLevel: this.extractExperienceLevel(title, description)
      };
      
    } catch (error) {
      logger.error('Error scraping job details:', error);
      return null;
    }
  }

  /**
   * Get job by ID (placeholder - needs to be implemented based on your job model)
   */
  private async getJobById(jobId: string, userId: string): Promise<any> {
    // This should be implemented based on your job application model
    // For now, return a mock job for testing
    return {
      title: "Software Development Engineer",
      company: "Amazon",
      location: "Vancouver, BC, Canada",
      description: "Software development role",
      jobType: "full-time",
      experienceLevel: "mid"
    };
  }

  /**
   * Extract search keywords from job application
   */
  private extractSearchKeywords(jobApplication: any): string[] {
    const keywords: string[] = [];
    
    // Extract from title
    if (jobApplication.title) {
      keywords.push(...jobApplication.title.split(/\s+/).filter((word: string) => word.length > 2));
    }
    
    // Extract from company
    if (jobApplication.company) {
      keywords.push(jobApplication.company);
    }
    
    // Extract from description
    if (jobApplication.description) {
      const descWords = jobApplication.description.split(/\s+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 10); // Limit to first 10 words
      keywords.push(...descWords);
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Find similar jobs from database
   */
  private async findSimilarJobsFromDatabase(
    jobApplication: any,
    limit: number = 5
  ): Promise<ISimilarJob[]> {
    try {
      logger.info('Finding similar jobs from available jobs database for:', jobApplication.title);

      // Search for jobs with similar titles, companies, or skills
      const searchParams = {
        title: this.extractMainTitle(jobApplication.title), // Extract main title without extra details
        company: this.extractMainCompany(jobApplication.company), // Extract main company name
        jobType: jobApplication.jobType ? [jobApplication.jobType] : undefined,
        experienceLevel: jobApplication.experienceLevel ? [jobApplication.experienceLevel] : undefined,
        limit: limit * 3 // Get more results to filter and score
      };

      const availableJobs = await availableJobModel.searchJobs(searchParams);

      let allAvailableJobs = [...availableJobs];

      // If no specific matches, try broader searches based on company and location
      if (allAvailableJobs.length === 0) {
        logger.info('No jobs found in database matching search criteria');

        // Extract company name and location for broader matching
        const companyName = this.extractMainCompany(jobApplication.company);
        const location = jobApplication.jobLocation || jobApplication.location || '';

        logger.info(`Trying broader search for company: ${companyName}, location: ${location}`);

        // Try to match by company name (case insensitive)
        if (companyName) {
          const companyJobs = await availableJobModel.searchJobs({
            company: companyName,
            limit: limit * 2
          });

          if (companyJobs.length > 0) {
            logger.info(`Found ${companyJobs.length} jobs matching company: ${companyName}`);
            allAvailableJobs.push(...companyJobs);
          }
        }

        // If still no results, try Amazon/Microsoft fallback
        if (allAvailableJobs.length === 0) {
          logger.info('No company matches found, trying Amazon/Microsoft fallback');

          // Try Amazon jobs
          const amazonJobs = await availableJobModel.searchJobs({
            company: 'amazon',
            limit: limit * 2
          });

          if (amazonJobs.length > 0) {
            logger.info(`Found ${amazonJobs.length} Amazon jobs with fallback search`);
            allAvailableJobs.push(...amazonJobs);
          }

          // Try Microsoft jobs
          const microsoftJobs = await availableJobModel.searchJobs({
            company: 'microsoft',
            limit: limit * 2
          });

          if (microsoftJobs.length > 0) {
            logger.info(`Found ${microsoftJobs.length} Microsoft jobs with fallback search`);
            allAvailableJobs.push(...microsoftJobs);
          }
        }
      }

      logger.info(`Found ${allAvailableJobs.length} potential matches in database`);

      // Calculate similarity scores and convert to ISimilarJob format
      const scoredJobs: ISimilarJob[] = [];

      for (const job of allAvailableJobs) {
        const similarityScore = this.calculateJobSimilarity(jobApplication, job);

        // Only include jobs with meaningful similarity (score > 0.05)
        if (similarityScore > 0.05) {
          scoredJobs.push({
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.jobLocation,
            url: job.url,
            salary: job.salary || undefined,
            jobType: job.jobType || undefined,
            experienceLevel: job.experienceLevel || undefined,
            source: 'database',
            score: similarityScore,
            postedDate: job.postedDate || job.createdAt
          });
        }
      }

      // Sort by similarity score (highest first) and return top results
      scoredJobs.sort((a, b) => (b.score || 0) - (a.score || 0));

      logger.info(`Returning ${Math.min(scoredJobs.length, limit)} similar jobs from database`);
      return scoredJobs.slice(0, limit);

    } catch (error) {
      logger.error('Error finding similar jobs from database:', error);
      return [];
    }
  }

  /**
   * Extract main title from job title (remove extra details)
   */
  private extractMainTitle(title: string): string {
    // Remove common suffixes and extra details
    return title
      .split(',')[0] // Take only the first part before comma
      .split(' - ')[0] // Take only the first part before dash
      .split(' at ')[0] // Remove "at company" part
      .trim();
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
   * Calculate similarity score between job application and available job
   */
  private calculateJobSimilarity(jobApplication: any, availableJob: any): number {
    let score = 0;

    // Title similarity (40% weight)
    const titleSimilarity = this.calculateTextSimilarity(
      this.extractMainTitle(jobApplication.title).toLowerCase(),
      this.extractMainTitle(availableJob.title).toLowerCase()
    );
    score += titleSimilarity * 0.4;

    // Company similarity (30% weight)
    const companySimilarity = this.calculateTextSimilarity(
      this.extractMainCompany(jobApplication.company).toLowerCase(),
      this.extractMainCompany(availableJob.company).toLowerCase()
    );
    score += companySimilarity * 0.3;

    // Location similarity (20% weight)
    const location1 = (jobApplication.jobLocation || jobApplication.location || '').toLowerCase();
    const location2 = (availableJob.jobLocation || '').toLowerCase();
    if (location1 && location2) {
      const locationSimilarity = this.calculateTextSimilarity(location1, location2);
      score += locationSimilarity * 0.2;
    }

    // Job type match (5% weight)
    if (jobApplication.jobType && availableJob.jobType && 
        jobApplication.jobType === availableJob.jobType) {
      score += 0.05;
    }

    // Experience level match (5% weight)
    if (jobApplication.experienceLevel && availableJob.experienceLevel && 
        jobApplication.experienceLevel === availableJob.experienceLevel) {
      score += 0.05;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Scrape jobs from unprotected sites (fallback)
   */
  private async scrapeJobsFromUnprotectedSites(keywords: string[], limit: number): Promise<ISimilarJob[]> {
    try {
      logger.info('Starting web scraping with keywords:', keywords.join(', '));

      const jobs: ISimilarJob[] = [];

      // Try scraping from GitHub Jobs
      try {
        logger.info('Scraping from GitHub Jobs...');
        const githubJobs = await this.scrapeFromGitHubJobs(keywords);
        jobs.push(...githubJobs);
      } catch (error) {
        logger.warn('GitHub Jobs scraping failed:', error);
      }

      // Try scraping from RemoteOK
      try {
        logger.info('Scraping from RemoteOK...');
        const remoteJobs = await this.scrapeFromRemoteOK(keywords);
        jobs.push(...remoteJobs);
        logger.info(`Found ${remoteJobs.length} jobs from RemoteOK`);
      } catch (error) {
        logger.warn('RemoteOK scraping failed:', error);
      }

      // Try scraping from Stack Overflow Jobs
      try {
        logger.info('Scraping from Stack Overflow Jobs...');
        const stackJobs = await this.scrapeFromStackOverflowJobs(keywords);
        jobs.push(...stackJobs);
        logger.info(`Found ${stackJobs.length} jobs from Stack Overflow Jobs`);
      } catch (error) {
        logger.warn('Stack Overflow Jobs scraping failed:', error);
      }

      // Remove duplicates and limit results
      const uniqueJobs = this.removeDuplicateJobs(jobs);
      logger.info(`Returning ${uniqueJobs.length} similar jobs with scores:`);
      
      return uniqueJobs.slice(0, limit);

    } catch (error) {
      logger.warn('Failed to scrape from Company Career Pages:', error);
      return [];
    }
  }

  /**
   * Scrape from GitHub Jobs
   */
  private async scrapeFromGitHubJobs(keywords: string[]): Promise<ISimilarJob[]> {
    try {
      const response = await axios.get('https://jobs.github.com/positions.atom', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const jobs: ISimilarJob[] = [];

      $('entry').each((_, entry) => {
        const title = $(entry).find('title').text().trim();
        const company = $(entry).find('name').text().trim();
        const location = $(entry).find('location').text().trim();
        const description = $(entry).find('summary').text().trim();
        const url = $(entry).find('link').attr('href') || '';

        if (title && company) {
          jobs.push({
            title,
            company,
            description,
            location,
            url,
            source: 'github',
            postedDate: new Date()
          });
        }
      });

      return jobs.slice(0, 5); // Limit to 5 jobs
    } catch (error) {
      throw new Error('GitHub Jobs scraping failed');
    }
  }

  /**
   * Scrape from RemoteOK
   */
  private async scrapeFromRemoteOK(keywords: string[]): Promise<ISimilarJob[]> {
    try {
      const response = await axios.get('https://remoteok.io/api', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const jobs: ISimilarJob[] = [];
      const data = response.data;

      if (Array.isArray(data)) {
        data.slice(1, 11).forEach((job: any) => { // Skip first element (metadata)
          if (job.position && job.company) {
            jobs.push({
              title: job.position,
              company: job.company,
              description: job.description || '',
              location: 'Remote',
              url: `https://remoteok.io/remote-jobs/${job.id}`,
              source: 'remoteok',
              postedDate: new Date(job.date * 1000)
            });
          }
        });
      }

      return jobs;
    } catch (error) {
      throw new Error('RemoteOK scraping failed');
    }
  }

  /**
   * Scrape from Stack Overflow Jobs
   */
  private async scrapeFromStackOverflowJobs(keywords: string[]): Promise<ISimilarJob[]> {
    try {
      const response = await axios.get('https://stackoverflow.com/jobs/feed', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const jobs: ISimilarJob[] = [];

      $('item').each((_, item) => {
        const title = $(item).find('title').text().trim();
        const company = $(item).find('a10\\:name, name').text().trim();
        const location = $(item).find('location').text().trim();
        const description = $(item).find('description').text().trim();
        const url = $(item).find('link').text().trim();

        if (title && company) {
          jobs.push({
            title,
            company,
            description,
            location,
            url,
            source: 'stackoverflow',
            postedDate: new Date()
          });
        }
      });

      return jobs.slice(0, 5); // Limit to 5 jobs
    } catch (error) {
      throw new Error('Stack Overflow Jobs scraping failed');
    }
  }
}

export const jobSearchService = new JobSearchService();

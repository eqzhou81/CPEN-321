import axios from 'axios';
import * as cheerio from 'cheerio';
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
              const salaryEl = card.querySelector(selectors.salary);
              const postedEl = card.querySelector(selectors.postedDate);
              
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
}

export const jobSearchService = new JobSearchService();

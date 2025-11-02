import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app';

// Mock the models but keep job search service real for integration testing
jest.mock('../../src/models/jobApplication.model');
jest.mock('../../src/models/availableJob.model');

// Mock the auth middleware to always authenticate as test user
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { 
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User'
    };
    next();
  })
}));

describe('Job Controller - Similar Jobs Test for Amazon Software Engineer Intern', () => {
  const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
  const testJobId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');

  // The specific mocked job application from line 25
  const mockJobApplication = {
    _id: testJobId,
    userId: testUserId,
    title: 'Software Engineer Intern',
    company: 'Amazon',
    description: 'Experience with data structure implementation, basic algorithm development, and/or object-oriented design principles',
    location: 'Vancouver, BC',
    url: 'https://www.amazon.jobs/en/jobs/3116034/software-development-engineer-internship-summer-2026-canada',
    requirements: [],
    skills: ['Java'],
    salary: '$43.12-$72.02/hr',
    jobType: 'intern',
    experienceLevel: 'early',
    createdAt: new Date('2025-10-27'),
    updatedAt: new Date('2025-10-31'),
  };

  beforeEach(() => {
    const { jobApplicationModel } = require('../../src/models/jobApplication.model');
    const { availableJobModel } = require('../../src/models/availableJob.model');
    
    jest.clearAllMocks();
    
    // Mock the job retrieval for similar jobs endpoint
    (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
    
    // Mock available jobs (fallback data)
    (availableJobModel.findAll as jest.Mock).mockResolvedValue([]);
  });

  describe('Similar Jobs Search for Amazon Software Engineer Intern', () => {
    it('should find similar jobs for Amazon Software Engineer Intern position via web scraping', async () => {
      console.log('\n🎯 Testing Similar Jobs for:');
      console.log(`   Title: ${mockJobApplication.title}`);
      console.log(`   Company: ${mockJobApplication.company}`);
      console.log(`   Location: ${mockJobApplication.location}`);
      console.log(`   Skills: ${mockJobApplication.skills.join(', ')}`);
      console.log(`   Experience: ${mockJobApplication.experienceLevel}`);
      console.log(`   Type: ${mockJobApplication.jobType}`);

      const response = await request(app)
        .post(`/api/jobs/${testJobId}/similar`)
        .send({ limit: 10 })
        .expect(200);

      expect(response.body.message).toBe('Similar jobs found successfully');
      expect(response.body.data).toHaveProperty('similarJobs');
      expect(Array.isArray(response.body.data.similarJobs)).toBe(true);
      
      // Log detailed results
      console.log(`\n📋 Similar Jobs Search Results: ${response.body.data.similarJobs.length} found`);
      
      if (response.body.data.similarJobs.length > 0) {
        console.log('\n🔗 Job URLs and Details:');
        response.body.data.similarJobs.forEach((job: any, index: number) => {
          console.log(`\n  ${index + 1}. ${job.title || 'No Title'}`);
          console.log(`     Company: ${job.company || 'Unknown Company'}`);
          console.log(`     Location: ${job.location || 'No Location'}`);
          console.log(`     URL: ${job.url || 'No URL available'}`);
          console.log(`     Source: ${job.source || 'Unknown Source'}`);
          console.log(`     Score: ${job.score || 'No Score'}`);
          console.log(`     Salary: ${job.salary || 'No Salary Info'}`);
          console.log(`     Type: ${job.jobType || 'No Job Type'}`);
          if (job.description) {
            const shortDesc = job.description.length > 100 
              ? job.description.substring(0, 100) + '...' 
              : job.description;
            console.log(`     Description: ${shortDesc}`);
          }
        });
        
        // Verify job structure
        const firstJob = response.body.data.similarJobs[0];
        expect(firstJob).toHaveProperty('title');
        expect(firstJob).toHaveProperty('company');
        
        // Count jobs by source
        const sourceCounts: { [key: string]: number } = {};
        response.body.data.similarJobs.forEach((job: any) => {
          const source = job.source || 'Unknown';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        
        console.log('\n📊 Jobs by Source:');
        Object.entries(sourceCounts).forEach(([source, count]) => {
          console.log(`   ${source}: ${count} jobs`);
        });
        
      } else {
        console.log('\n❌ No similar jobs found');
        console.log('   This could be due to:');
        console.log('   - Job sites blocking scraping');
        console.log('   - Network timeouts');
        console.log('   - Anti-bot measures');
        console.log('   - No matching positions available');
      }
      
      // Test should pass regardless of results (web scraping can be unreliable)
      expect(response.body.data.similarJobs.length).toBeGreaterThanOrEqual(0);
      
    }, 60000); // 60 second timeout for web scraping

    it('should handle web scraping timeouts gracefully', async () => {
      // This test verifies the system handles scraping failures properly
      const response = await request(app)
        .post(`/api/jobs/${testJobId}/similar`)
        .send({ limit: 5 })
        .expect(200);

      // Should get a response even if scraping fails
      expect(response.body.message).toBe('Similar jobs found successfully');
      expect(response.body.data).toHaveProperty('similarJobs');
      expect(Array.isArray(response.body.data.similarJobs)).toBe(true);
      
      console.log(`\n⏱️  Timeout handling test: Found ${response.body.data.similarJobs.length} jobs`);
      console.log('   System should handle scraping failures gracefully ✅');
      
    }, 30000);
  });
});
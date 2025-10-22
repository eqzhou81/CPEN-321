import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// In-memory database for testing
let jobApplications = [
  {
    _id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'We are looking for a senior software engineer to join our team...',
    location: 'San Francisco, CA',
    url: 'https://example.com/job/1',
    salary: '$120,000 - $150,000',
    jobType: 'full-time',
    experienceLevel: 'senior',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    description: 'Join our fast-growing startup as a frontend developer...',
    location: 'Remote',
    url: 'https://example.com/job/2',
    salary: '$80,000 - $100,000',
    jobType: 'full-time',
    experienceLevel: 'mid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextId = 3;

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { _id: 'mock-user-id', email: 'test@example.com' };
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date().toISOString(),
    database: 'in-memory'
  });
});

// Get all job applications
app.get('/api/jobs', mockAuth, (req, res) => {
  res.json({
    message: 'Job applications fetched successfully',
    data: { jobApplications }
  });
});

// Get single job application
app.get('/api/jobs/:id', mockAuth, (req, res) => {
  const job = jobApplications.find(j => j._id === req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job application not found' });
  }
  res.json({
    message: 'Job application fetched successfully',
    data: { jobApplication: job }
  });
});

// Create job application
app.post('/api/jobs', mockAuth, (req, res) => {
  const { title, company, description, location, url, salary, jobType, experienceLevel } = req.body;
  
  if (!title || !company || !description) {
    return res.status(400).json({ message: 'Title, company, and description are required' });
  }
  
  const newJob = {
    _id: nextId.toString(),
    title,
    company,
    description,
    location: location || undefined,
    url: url || undefined,
    salary: salary || undefined,
    jobType: jobType || undefined,
    experienceLevel: experienceLevel || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  jobApplications.unshift(newJob);
  nextId++;
  
  res.status(201).json({
    message: 'Job application created successfully',
    data: { jobApplication: newJob }
  });
});

// Scrape job details from URL
app.post('/api/jobs/scrape', mockAuth, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }
  
  try {
    // Enhanced mock scraping with more realistic data based on URL
    let mockScrapedJob;
    
    if (url.includes('indeed')) {
      mockScrapedJob = {
        title: 'Software Engineer - Indeed',
        company: 'Tech Company',
        description: 'We are seeking a talented Software Engineer to join our growing team. You will work on cutting-edge projects and collaborate with a diverse group of professionals.',
        location: 'San Francisco, CA',
        url: url,
        salary: '$120,000 - $150,000',
        jobType: 'full-time',
        experienceLevel: 'senior'
      };
    } else if (url.includes('linkedin')) {
      mockScrapedJob = {
        title: 'Senior Developer - LinkedIn',
        company: 'Innovation Labs',
        description: 'Join our dynamic team as a Senior Developer. We offer competitive benefits, flexible work arrangements, and opportunities for career growth.',
        location: 'New York, NY',
        url: url,
        salary: '$130,000 - $160,000',
        jobType: 'full-time',
        experienceLevel: 'senior'
      };
    } else if (url.includes('glassdoor')) {
      mockScrapedJob = {
        title: 'Full Stack Developer - Glassdoor',
        company: 'StartupXYZ',
        description: 'We are looking for a Full Stack Developer with experience in React, Node.js, and modern web technologies. Remote work available.',
        location: 'Remote',
        url: url,
        salary: '$100,000 - $130,000',
        jobType: 'full-time',
        experienceLevel: 'mid'
      };
    } else {
      // Generic scraping result
      mockScrapedJob = {
        title: 'Software Developer',
        company: 'Tech Corp',
        description: 'We are seeking a Software Developer to join our team. This position offers great opportunities for growth and development.',
        location: 'Remote',
        url: url,
        salary: '$90,000 - $120,000',
        jobType: 'full-time',
        experienceLevel: 'mid'
      };
    }
    
    res.json({
      message: 'Job details scraped successfully',
      data: { jobDetails: mockScrapedJob }
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      message: 'Failed to scrape job details',
      error: 'Scraping service temporarily unavailable'
    });
  }
});

// Update job application
app.put('/api/jobs/:id', mockAuth, (req, res) => {
  const jobIndex = jobApplications.findIndex(j => j._id === req.params.id);
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job application not found' });
  }
  
  const updatedJob = {
    ...jobApplications[jobIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  jobApplications[jobIndex] = updatedJob;
  
  res.json({
    message: 'Job application updated successfully',
    data: { jobApplication: updatedJob }
  });
});

// Delete job application
app.delete('/api/jobs/:id', mockAuth, (req, res) => {
  const jobIndex = jobApplications.findIndex(j => j._id === req.params.id);
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job application not found' });
  }
  
  jobApplications.splice(jobIndex, 1);
  
  res.json({ message: 'Job application deleted successfully' });
});

// Search job applications
app.get('/api/jobs/search/:query', mockAuth, (req, res) => {
  const query = req.params.query.toLowerCase();
  const filteredJobs = jobApplications.filter(job => 
    job.title.toLowerCase().includes(query) ||
    job.company.toLowerCase().includes(query) ||
    job.description.toLowerCase().includes(query)
  );
  
  res.json({
    message: 'Search completed successfully',
    data: { jobApplications: filteredJobs }
  });
});

// Error handling middleware
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend should connect to http://localhost:${PORT}/api`);
  console.log(`💾 Database: In-memory (for testing)`);
  console.log(`📋 Sample data: ${jobApplications.length} job applications loaded`);
});

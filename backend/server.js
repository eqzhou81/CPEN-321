import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://10.0.2.2:3000',  // Android emulator localhost
    'http://localhost:3000'  // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Mock auth routes for testing
app.post('/api/auth/signup', (req, res) => {
  res.json({ 
    message: 'User signed up successfully',
    data: {
      user: { _id: '123', name: 'Test User', email: 'test@example.com' },
      token: 'mock-token-123'
    }
  });
});

app.post('/api/auth/signin', (req, res) => {
  res.json({ 
    message: 'User signed in successfully',
    data: {
      user: { _id: '123', name: 'Test User', email: 'test@example.com' },
      token: 'mock-token-123'
    }
  });
});

// Mock job routes for testing
app.get('/api/jobs', (req, res) => {
  res.json({
    message: 'Job applications fetched successfully',
    data: {
      jobApplications: [
        {
          _id: '1',
          title: 'Software Engineer',
          company: 'Test Company',
          description: 'Test job description',
          createdAt: new Date().toISOString()
        }
      ],
      total: 1
    }
  });
});

app.post('/api/jobs', (req, res) => {
  res.json({
    message: 'Job application created successfully',
    data: {
      jobApplication: {
        _id: '2',
        ...req.body,
        createdAt: new Date().toISOString()
      }
    }
  });
});

app.delete('/api/jobs/:id', (req, res) => {
  res.json({ message: 'Job application deleted successfully' });
});

app.post('/api/jobs/scrape', (req, res) => {
  res.json({
    message: 'Job details scraped successfully',
    data: {
      jobDetails: {
        title: 'Scraped Job Title',
        company: 'Scraped Company',
        description: 'Scraped job description from URL',
        location: 'Remote'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend should connect to http://localhost:${PORT}/api`);
});

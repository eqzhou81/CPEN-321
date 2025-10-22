# Backend API Documentation - dev-nikoo Branch

## Overview

This branch implements two main features:
1. **Job Application Management** - Complete CRUD operations for managing job applications
2. **Similar Jobs Search** - Algorithm-based job search with location filtering

## Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- Environment variables configured

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
JWT_SECRET=d0f33ab7343dfff05cc1b6917bddaf6b3917e0fcf38dc3cf5659b66cea366834
GOOGLE_CLIENT_ID=722713065040-vvtc91nkhp786u7577ll1lvfjaa44ldu.apps.googleusercontent.com
MONGODB_URI=mongodb://localhost:27017/cpen321
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Running the Server

```bash
# Development mode (with TypeScript)
npm run dev

# Production mode (requires build)
npm run build
npm start

# Using the production server file
node server-production.js
```

## Feature 1: Job Application Management

### Description
Allows users to create, read, update, and delete job applications. Users can:
- Paste job posting content directly (text field)
- Paste a link to scrape job details automatically
- View all saved applications in a searchable list
- Click on applications to view details
- Search applications by text
- Filter by company
- View statistics

### API Endpoints

#### Create Job Application
```http
POST /api/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "Full-stack development position",
  "location": "San Francisco, CA",
  "url": "https://example.com/job",
  "salary": "$100,000 - $120,000",
  "jobType": "full-time",
  "experienceLevel": "mid",
  "requirements": ["React", "Node.js"],
  "skills": ["JavaScript", "TypeScript"]
}
```

#### Get All Job Applications
```http
GET /api/jobs?page=1&limit=20
Authorization: Bearer {token}
```

#### Get Job Application by ID
```http
GET /api/jobs/:id
Authorization: Bearer {token}
```

#### Update Job Application
```http
PUT /api/jobs/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "salary": "$110,000 - $130,000",
  "jobType": "remote"
}
```

#### Delete Job Application
```http
DELETE /api/jobs/:id
Authorization: Bearer {token}
```

#### Search Job Applications
```http
GET /api/jobs/search?q=React&page=1&limit=20
Authorization: Bearer {token}
```

#### Get Jobs by Company
```http
GET /api/jobs/by-company?company=Google&page=1&limit=20
Authorization: Bearer {token}
```

#### Get Job Statistics
```http
GET /api/jobs/statistics
Authorization: Bearer {token}
```

#### Scrape Job from URL
```http
POST /api/jobs/scrape
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://www.indeed.com/viewjob?jk=example"
}
```

## Feature 2: Similar Jobs Search

### Description
For each job application, users can search for similar job postings. The system:
- Searches for jobs with same/similar titles
- Calculates distance from user's location
- Identifies remote positions
- Uses a similarity scoring algorithm based on:
  - Title similarity (40% weight)
  - Company similarity (20% weight)
  - Location proximity (20% weight)
  - Job type match (10% weight)
  - Experience level match (10% weight)

### Algorithm Details

The similar jobs algorithm works as follows:

1. **Job Scraping**: Searches multiple job sites (LinkedIn, Indeed, Glassdoor) in parallel
2. **Deduplication**: Removes duplicate jobs based on title + company
3. **Similarity Scoring**: Calculates a score (0-1) for each job:
   - **Title Similarity**: Uses word overlap (Jaccard similarity)
   - **Company Similarity**: Matches company names
   - **Location Proximity**: Geocodes addresses and calculates distance
     - ≤10 miles: 1.0 score
     - ≤25 miles: 0.8 score
     - ≤50 miles: 0.6 score
     - ≤100 miles: 0.4 score
     - >100 miles: 0.2 score
   - **Remote Jobs**: Score of 1.0 if both remote, 0.5 if one remote
   - **Job Type/Experience**: Exact match bonuses
4. **Ranking**: Jobs sorted by similarity score
5. **Filtering**: Returns top N results (default 20)

### API Endpoint

#### Search Similar Jobs
```http
POST /api/jobs/:id/similar
Authorization: Bearer {token}
Content-Type: application/json

{
  "radius": 50,
  "jobType": ["full-time", "remote"],
  "experienceLevel": ["mid", "senior"],
  "salaryMin": 80000,
  "salaryMax": 150000,
  "remote": true,
  "limit": 20
}
```

**Parameters:**
- `radius`: Search radius in miles (1-100, default: 25)
- `jobType`: Array of job types to filter
- `experienceLevel`: Array of experience levels to filter
- `salaryMin`: Minimum salary
- `salaryMax`: Maximum salary
- `remote`: Include remote positions (default: true)
- `limit`: Maximum number of results (1-100, default: 20)

**Response:**
```json
{
  "message": "Similar jobs found successfully",
  "data": {
    "similarJobs": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "Full-stack development position",
        "location": "San Francisco, CA",
        "url": "https://techcorp.com/jobs/senior-engineer",
        "salary": "$120,000 - $150,000",
        "jobType": "full-time",
        "experienceLevel": "senior",
        "source": "linkedin",
        "distance": 5.2,
        "postedDate": "2024-01-15T00:00:00.000Z"
      }
    ],
    "total": 15,
    "searchParams": {
      "radius": 50,
      "remote": true,
      "limit": 20,
      "title": "Software Engineer",
      "company": "Original Company",
      "location": "San Francisco, CA"
    }
  }
}
```

## Testing

### Manual Testing with curl

Use the provided test script:

```bash
./test-api.sh
```

Or test individual endpoints:

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health

# Create job (requires auth token)
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "company": "Tech Corp",
    "description": "Full-stack development"
  }'
```

### Getting an Auth Token

1. Use the Google Sign-in from the frontend
2. The token will be returned in the authentication response
3. Use that token for subsequent API calls

### Testing with MongoDB

Ensure MongoDB is running:

```bash
# Start MongoDB
mongod

# Check connection
mongo --eval "db.adminCommand('ping')"
```

## Data Models

### Job Application Schema

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String (required),
  company: String (required),
  description: String (required),
  location: String (optional),
  url: String (optional, validated URL),
  requirements: Array<String>,
  skills: Array<String>,
  salary: String,
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote',
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive',
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Error type"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Server Error

## Dependencies

Key packages used:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `puppeteer` - Web scraping for job details
- `node-geocoder` - Location geocoding
- `jsonwebtoken` - JWT authentication
- `zod` - Schema validation
- `axios` - HTTP requests
- `cheerio` - HTML parsing

## Performance Considerations

- Job scraping is done in parallel for multiple sites
- Results are cached temporarily to avoid repeated scraping
- Database indexes on userId, title, company for fast queries
- Pagination support for large result sets
- Text search indexes for full-text search

## Future Improvements

- [ ] Add Redis caching for scraped jobs
- [ ] Implement rate limiting for scraping
- [ ] Add more job sources
- [ ] Improve geocoding accuracy
- [ ] Add job alerts/notifications
- [ ] Export job applications to PDF/CSV
- [ ] Machine learning for better similarity matching

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Puppeteer Issues
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y libgbm-dev

# Use system Chrome (if Puppeteer Chrome doesn't work)
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

## License

This project is part of CPEN-321 course work.

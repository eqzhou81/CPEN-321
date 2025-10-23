# Find Similar Jobs Feature Implementation

## Overview
This PR implements a "Find Similar Jobs" functionality that allows users to discover relevant job opportunities based on their existing job applications.

## Features Implemented

### 1. Database-First Job Search
- **New Model**: `availableJob.model.ts` - Stores 20 pre-populated Amazon and Microsoft Vancouver software jobs
- **Database Integration**: Jobs are stored in the same `cpen321` database as user job applications
- **Search Logic**: Case-insensitive company and title matching with similarity scoring

### 2. Enhanced Job Search Service
- **Hybrid Approach**: Database search first, web scraping fallback
- **Similarity Algorithm**: Weighted scoring based on title, company, location, and job type
- **Company Matching**: Handles variations like "amazon.jobs" → "Amazon"
- **Location Intelligence**: Geographic proximity scoring

### 3. API Endpoints
- **GET** `/api/jobs/similar/:jobId` - Find similar jobs for a specific job application
- **Parameters**: `limit` (default: 5) to control number of results
- **Response**: Array of similar jobs with similarity scores and metadata

## Technical Implementation

### Database Schema
```typescript
interface IAvailableJob {
  title: string;
  company: string;
  description: string;
  jobLocation: string;
  url: string;
  salary?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  skills?: string[];
  requirements?: string[];
  isRemote?: boolean;
  postedDate?: Date;
}
```

### Search Algorithm
1. **Primary Search**: Exact title and company matching
2. **Broader Search**: Company-only matching with location consideration
3. **Fallback Search**: Amazon/Microsoft specific searches
4. **Similarity Scoring**: Weighted algorithm considering multiple factors
5. **Web Scraping**: Fallback to external job sites if database search fails

### Sample Jobs Database
- **10 Amazon Vancouver jobs**: Software Development Engineer, Data Engineer, DevOps Engineer, etc.
- **10 Microsoft Vancouver jobs**: Software Engineer, Cloud Solutions Architect, Full Stack Developer, etc.
- **All jobs**: Vancouver-based, software roles, realistic descriptions and requirements

## Files Added/Modified

### New Files
- `src/models/availableJob.model.ts` - Available jobs database model
- `populate-jobs.js` - Script to populate database with sample jobs

### Modified Files
- `src/services/jobSearch.service.ts` - Enhanced with database search functionality
- `src/types/job.types.ts` - Added interfaces for available jobs
- `src/routes/job.routes.ts` - Added similar jobs endpoint

## Testing
- ✅ Database population verified (20 jobs)
- ✅ Search functionality tested with various job titles
- ✅ Company name matching verified (case-insensitive)
- ✅ Similarity scoring algorithm validated
- ✅ API endpoint tested with real job applications

## Production Readiness
- ✅ No hardcoded test credentials
- ✅ No authentication bypassing
- ✅ Proper error handling and logging
- ✅ Clean code with appropriate comments
- ✅ Temporary test files removed

## Usage
```typescript
// Find similar jobs for a job application
const similarJobs = await jobSearchService.findSimilarJobs(jobId, userId, 5);

// Response format
{
  title: "Software Development Engineer",
  company: "Amazon", 
  location: "Vancouver, BC, Canada",
  source: "database",
  score: 0.6,
  url: "https://amazon.jobs/...",
  salary: "$120,000 - $180,000 CAD"
}
```

## Database Setup
Run `node populate-jobs.js` to populate the available jobs database with sample data.

## Notes
- The feature gracefully falls back to web scraping if database search yields no results
- Similarity threshold is set to 0.05 to ensure inclusive results
- All jobs are stored in the same database as user applications for consistency
- No authentication bypassing or development-specific code included

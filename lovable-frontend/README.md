# Job Application Tracker - Frontend Integration

This is the web frontend for the Job Application Tracker, integrated with the backend API.

## Features

- **Authentication**: Google OAuth integration with backend
- **Job Management**: Create, read, update, delete job applications
- **Job Scraping**: Extract job details from URLs
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Real-time Updates**: Uses React Query for data fetching and caching

## Setup Instructions

### 1. Install Dependencies

```bash
cd lovable-frontend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `lovable-frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:5173` to authorized origins
6. Copy the Client ID to your `.env.local` file

### 4. Backend Setup

Make sure your backend is running on port 3000:

```bash
cd ../backend
npm install
npm run dev
```

### 5. Start Frontend

```bash
cd lovable-frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Integration

The frontend is fully integrated with the backend API:

- **Authentication**: `/api/auth/signup` and `/api/auth/signin`
- **Job Applications**: `/api/jobs/*` endpoints
- **User Profile**: `/api/user/profile`
- **Media Upload**: `/api/media/*` endpoints

## Key Components

- `src/services/api.ts` - Axios configuration with auth interceptors
- `src/services/authService.ts` - Authentication API calls
- `src/services/jobService.ts` - Job application API calls
- `src/pages/Auth.tsx` - Google OAuth integration
- `src/pages/Dashboard.tsx` - Job application management

## Development Notes

- The frontend uses React Query for state management and caching
- Authentication tokens are stored in localStorage
- CORS is configured in the backend to allow frontend requests
- All API calls include proper error handling and loading states
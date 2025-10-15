# Team Setup Guide

## Quick Start for Team Members

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd CPEN-321-2
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# PORT=3000
# JWT_SECRET=your_jwt_secret_here
# GOOGLE_CLIENT_ID=your_google_web_client_id
# MONGODB_URI=mongodb://localhost:27017/job-tracker
# FRONTEND_URL=http://localhost:8081
npm run dev
```

### 3. Frontend Setup
```bash
cd lovable-frontend
npm install
# Create .env.local file with:
# VITE_API_URL=http://localhost:3000/api
# VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
npm run dev
```

### 4. Access the Application
- Backend API: http://localhost:3000/api
- Web Frontend: http://localhost:8081
- Use "Skip Authentication" button for demo mode

## Features Available
- ✅ Job Application Management
- ✅ User Authentication (Google OAuth + Skip option)
- ✅ Profile Management
- ✅ Technical/Behavioral Questions
- ✅ Discussion Panels
- ✅ Mobile Responsive Design

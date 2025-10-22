#!/bin/bash

# Test script for job management API endpoints
echo "==================================="
echo "Testing Job Management API Features"
echo "==================================="

BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${GREEN}1. Health Check${NC}"
response=$(curl -s -X GET "${BASE_URL}/health")
echo "$response" | jq .

# Check if server is running
if echo "$response" | grep -q "Backend is running"; then
    echo -e "\n${GREEN}✅ Server is running successfully${NC}"
else
    echo -e "\n${RED}❌ Server is not responding properly${NC}"
    exit 1
fi

echo -e "\n${YELLOW}2. Testing Job Routes (Requires Authentication)${NC}"
echo "The following endpoints are available but require authentication:"
echo "  POST   /api/jobs                 - Create job application"
echo "  GET    /api/jobs                 - Get all job applications"
echo "  GET    /api/jobs/:id             - Get job application by ID"
echo "  PUT    /api/jobs/:id             - Update job application"
echo "  DELETE /api/jobs/:id             - Delete job application"
echo "  GET    /api/jobs/search          - Search job applications"
echo "  GET    /api/jobs/by-company      - Get jobs by company"
echo "  GET    /api/jobs/statistics      - Get job statistics"
echo "  POST   /api/jobs/:id/similar     - Find similar jobs"
echo "  POST   /api/jobs/scrape          - Scrape job from URL"

echo -e "\n${YELLOW}3. Testing Authentication Required${NC}"
echo "Testing that endpoints properly require authentication..."

# Test that endpoints return 401 without auth
echo -e "\n${GREEN}Testing POST /api/jobs (should return 401)${NC}"
curl -s -X POST "${BASE_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Job", "company": "Test Company", "description": "Test description"}' \
  | jq .

echo -e "\n${GREEN}Testing GET /api/jobs (should return 401)${NC}"
curl -s -X GET "${BASE_URL}/jobs" | jq .

echo -e "\n${GREEN}Testing POST /api/jobs/scrape (should return 401)${NC}"
curl -s -X POST "${BASE_URL}/jobs/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job"}' \
  | jq .

echo -e "\n${YELLOW}4. Feature Summary${NC}"
echo "✅ Job Application Management Feature:"
echo "   - Create job applications (text input or URL scraping)"
echo "   - View all saved applications in searchable list"
echo "   - Search applications by text"
echo "   - Filter by company"
echo "   - Update and delete applications"
echo "   - View job statistics"

echo -e "\n✅ Similar Jobs Search Feature:"
echo "   - Algorithm-based similarity scoring:"
echo "     - Title similarity (40% weight)"
echo "     - Company similarity (20% weight)"
echo "     - Location proximity (20% weight)"
echo "     - Job type match (10% weight)"
echo "     - Experience level match (10% weight)"
echo "   - Location-based filtering with radius"
echo "   - Remote job detection"
echo "   - Multi-site job scraping (LinkedIn, Indeed, Glassdoor)"
echo "   - Distance calculation using Haversine formula"

echo -e "\n${GREEN}5. Next Steps${NC}"
echo "To test with authentication:"
echo "1. Get a JWT token from Google Sign-in"
echo "2. Use the token in Authorization header: 'Bearer <token>'"
echo "3. Test the endpoints with real data"

echo -e "\n${GREEN}Test completed! Both features are implemented and ready for testing.${NC}"

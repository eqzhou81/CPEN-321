#!/bin/bash

# Test script for job management API
echo "==================================="
echo "Testing Job Management API"
echo "==================================="

BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Health check
echo -e "\n${GREEN}1. Health Check${NC}"
curl -s -X GET "${BASE_URL}/health" | jq .

# Note: These tests require authentication
# You'll need to replace TOKEN with an actual JWT token from Google Sign-in

# Uncomment and replace TOKEN to test authenticated endpoints:

# TOKEN="your-jwt-token-here"

# echo -e "\n${GREEN}2. Create Job Application${NC}"
# curl -s -X POST "${BASE_URL}/jobs" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "title": "Software Engineer",
#     "company": "Tech Corp",
#     "description": "Full-stack development position requiring React and Node.js experience",
#     "location": "San Francisco, CA",
#     "salary": "$100,000 - $120,000",
#     "jobType": "full-time",
#     "experienceLevel": "mid"
#   }' | jq .

# echo -e "\n${GREEN}3. Get All Job Applications${NC}"
# curl -s -X GET "${BASE_URL}/jobs" \
#   -H "Authorization: Bearer ${TOKEN}" | jq .

# echo -e "\n${GREEN}4. Search Job Applications${NC}"
# curl -s -X GET "${BASE_URL}/jobs/search?q=Software" \
#   -H "Authorization: Bearer ${TOKEN}" | jq .

# echo -e "\n${GREEN}5. Scrape Job from URL${NC}"
# curl -s -X POST "${BASE_URL}/jobs/scrape" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "url": "https://www.indeed.com/viewjob?jk=example"
#   }' | jq .

# Replace JOB_ID with actual job ID from create response
# JOB_ID="your-job-id-here"

# echo -e "\n${GREEN}6. Get Job by ID${NC}"
# curl -s -X GET "${BASE_URL}/jobs/${JOB_ID}" \
#   -H "Authorization: Bearer ${TOKEN}" | jq .

# echo -e "\n${GREEN}7. Search Similar Jobs${NC}"
# curl -s -X POST "${BASE_URL}/jobs/${JOB_ID}/similar" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "radius": 50,
#     "remote": true,
#     "limit": 10
#   }' | jq .

# echo -e "\n${GREEN}8. Update Job Application${NC}"
# curl -s -X PUT "${BASE_URL}/jobs/${JOB_ID}" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "salary": "$110,000 - $130,000",
#     "jobType": "remote"
#   }' | jq .

# echo -e "\n${GREEN}9. Delete Job Application${NC}"
# curl -s -X DELETE "${BASE_URL}/jobs/${JOB_ID}" \
#   -H "Authorization: Bearer ${TOKEN}" | jq .

echo -e "\n${GREEN}Test completed!${NC}"
echo "Note: Authenticated endpoints are commented out."
echo "To test them, get a valid JWT token and uncomment the relevant sections."

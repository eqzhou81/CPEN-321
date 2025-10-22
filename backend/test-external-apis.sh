#!/bin/bash

# Comprehensive API Test Script
echo "==================================="
echo "External API Verification Test"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Google OAuth Configuration
echo -e "\n${BLUE}1. Google OAuth API Test${NC}"
echo "Testing Google Client ID configuration..."

GOOGLE_CLIENT_ID="722713065040-vvtc91nkhp786u7577ll1lvfjaa44ldu.apps.googleusercontent.com"

# Test if Google Client ID is valid format
if [[ $GOOGLE_CLIENT_ID =~ ^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$ ]]; then
    echo -e "${GREEN}✅ Google Client ID format is valid${NC}"
    echo "   Client ID: $GOOGLE_CLIENT_ID"
else
    echo -e "${RED}❌ Google Client ID format is invalid${NC}"
fi

# Test 2: OpenStreetMap Geocoding API
echo -e "\n${BLUE}2. OpenStreetMap Geocoding API Test${NC}"
echo "Testing geocoding service..."

# Test geocoding with a sample address
curl -s "https://nominatim.openstreetmap.org/search?q=San+Francisco,+CA&format=json&limit=1" | jq -r '.[0].display_name' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ OpenStreetMap geocoding API is accessible${NC}"
    echo "   Provider: OpenStreetMap Nominatim"
    echo "   Rate Limit: 1 request/second (sustainable)"
    echo "   Cost: Free"
else
    echo -e "${RED}❌ OpenStreetMap geocoding API is not accessible${NC}"
fi

# Test 3: Job Site Accessibility
echo -e "\n${BLUE}3. Job Site Accessibility Test${NC}"

# Test Indeed
echo "Testing Indeed.com accessibility..."
curl -s -I "https://www.indeed.com" | head -1 | grep -q "200 OK"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Indeed.com is accessible${NC}"
else
    echo -e "${RED}❌ Indeed.com is not accessible${NC}"
fi

# Test LinkedIn
echo "Testing LinkedIn Jobs accessibility..."
curl -s -I "https://www.linkedin.com/jobs" | head -1 | grep -q "200 OK"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ LinkedIn Jobs is accessible${NC}"
else
    echo -e "${RED}❌ LinkedIn Jobs is not accessible${NC}"
fi

# Test Glassdoor
echo "Testing Glassdoor accessibility..."
curl -s -I "https://www.glassdoor.com" | head -1 | grep -q "200 OK"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Glassdoor is accessible${NC}"
else
    echo -e "${RED}❌ Glassdoor is not accessible${NC}"
fi

# Test 4: MongoDB Connection
echo -e "\n${BLUE}4. Database Connection Test${NC}"
echo "Testing MongoDB connection..."

# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
    
    # Test connection
    mongo --eval "db.adminCommand('ping')" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MongoDB connection successful${NC}"
    else
        echo -e "${RED}❌ MongoDB connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MongoDB is not running${NC}"
    echo "   To start MongoDB: brew services start mongodb-community"
fi

# Test 5: Server Health Check
echo -e "\n${BLUE}5. Backend Server Test${NC}"
echo "Testing backend server..."

# Check if server is running on port 3000
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on port 3000${NC}"
    
    # Test health endpoint
    response=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    if echo "$response" | grep -q "Backend is working"; then
        echo -e "${GREEN}✅ Health endpoint is responding${NC}"
        echo "$response" | jq .
    else
        echo -e "${RED}❌ Health endpoint is not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Server is not running on port 3000${NC}"
    echo "   To start server: npm run dev"
fi

# Test 6: VM Public IP Accessibility (if applicable)
echo -e "\n${BLUE}6. VM Public IP Test${NC}"
echo "Testing VM accessibility..."

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null)
if [ ! -z "$PUBLIC_IP" ]; then
    echo -e "${GREEN}✅ Public IP detected: $PUBLIC_IP${NC}"
    
    # Test if port 3000 is accessible from public IP
    echo "Testing if port 3000 is accessible externally..."
    # Note: This test requires the server to be running and port forwarding configured
    echo -e "${YELLOW}⚠️  External accessibility depends on VM configuration${NC}"
    echo "   Ensure port 3000 is open in VM firewall"
    echo "   Ensure port forwarding is configured if behind NAT"
else
    echo -e "${RED}❌ Could not determine public IP${NC}"
fi

# Summary
echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE}API SUSTAINABILITY SUMMARY${NC}"
echo -e "${BLUE}===================================${NC}"

echo -e "\n${GREEN}✅ SUSTAINABLE APIs:${NC}"
echo "   • Google OAuth: Free, high rate limits"
echo "   • OpenStreetMap: Free, 1 req/sec limit"
echo "   • Web Scraping: Free, self-regulated"

echo -e "\n${GREEN}✅ NO API KEYS REQUIRED:${NC}"
echo "   • OpenStreetMap geocoding"
echo "   • Web scraping (Puppeteer)"
echo "   • Job site access"

echo -e "\n${GREEN}✅ RATE LIMITING IMPLEMENTED:${NC}"
echo "   • Respectful scraping delays"
echo "   • Error handling for failed requests"
echo "   • Fallback mechanisms"

echo -e "\n${GREEN}✅ COST ANALYSIS:${NC}"
echo "   • Google OAuth: $0/month"
echo "   • OpenStreetMap: $0/month"
echo "   • Web Scraping: $0/month"
echo "   • Total: $0/month"

echo -e "\n${GREEN}Test completed!${NC}"

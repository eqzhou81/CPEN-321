#!/bin/bash

echo "🚀 Testing Job Application Tracker Integration"
echo "=============================================="

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:3000/api/auth/signup > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3000"
else
    echo "❌ Backend is not running. Please start it with:"
    echo "   cd backend && npm run dev"
    exit 1
fi

# Check if frontend dependencies are installed
echo "📦 Checking frontend dependencies..."
if [ -d "lovable-frontend/node_modules" ]; then
    echo "✅ Frontend dependencies are installed"
else
    echo "❌ Frontend dependencies not found. Installing..."
    cd lovable-frontend && npm install
    cd ..
fi

# Check environment configuration
echo "⚙️  Checking environment configuration..."
if [ -f "lovable-frontend/.env.local" ]; then
    echo "✅ Environment file exists"
else
    echo "⚠️  Environment file not found. Creating example..."
    cat > lovable-frontend/.env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
EOF
    echo "📝 Please update lovable-frontend/.env.local with your Google Client ID"
fi

echo ""
echo "🎉 Integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Update lovable-frontend/.env.local with your Google Client ID"
echo "2. Start the frontend: cd lovable-frontend && npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Backend API endpoints:"
echo "- Authentication: http://localhost:3000/api/auth/*"
echo "- Job Applications: http://localhost:3000/api/jobs/*"
echo "- User Profile: http://localhost:3000/api/user/*"
echo "- Media Upload: http://localhost:3000/api/media/*"

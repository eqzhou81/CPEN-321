#!/bin/bash

echo "🔧 Setting up Job Application Tracker Backend"
echo "============================================="

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=3000
JWT_SECRET=dev_jwt_secret_change_in_production_$(date +%s)
GOOGLE_CLIENT_ID=your_google_web_client_id_here
MONGODB_URI=mongodb://localhost:27017/job-tracker
FRONTEND_URL=http://localhost:8081
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is available"
    echo "💡 Make sure MongoDB is running: mongod"
else
    echo "⚠️  MongoDB not found. Please install MongoDB:"
    echo "   - macOS: brew install mongodb-community"
    echo "   - Ubuntu: sudo apt-get install mongodb"
    echo "   - Windows: Download from https://www.mongodb.com/try/download/community"
fi

echo ""
echo "🚀 Setup complete! To start the server:"
echo "   npm run dev:real"
echo ""
echo "📋 Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Update .env with your Google Client ID"
echo "3. Start the server with: npm run dev:real"

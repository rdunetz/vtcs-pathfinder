#!/bin/bash

# Build and push script for VTCS PathFinder
# Usage: ./build-and-push.sh GITHUB_ORG_OR_USERNAME
# Example: ./build-and-push.sh vtcs-pathfinder

set -e  # Exit on error

# Check if org/username is provided
if [ -z "$1" ]; then
    echo "❌ Error: GitHub organization/username not provided"
    echo "Usage: ./build-and-push.sh GITHUB_ORG_OR_USERNAME"
    echo "Example: ./build-and-push.sh vtcs-pathfinder"
    exit 1
fi

GITHUB_ORG=$1
BACKEND_IMAGE="ghcr.io/$GITHUB_ORG/vtcs-pathfinder-backend:latest"
FRONTEND_IMAGE="ghcr.io/$GITHUB_ORG/vtcs-pathfinder-frontend:latest"

echo "🚀 Building and pushing VTCS PathFinder images..."
echo "   Backend:  $BACKEND_IMAGE"
echo "   Frontend: $FRONTEND_IMAGE"
echo ""

# Build backend
echo "📦 Building backend image..."
cd backend
docker build -t $BACKEND_IMAGE .
echo "✅ Backend image built"
echo ""

# Build frontend
echo "📦 Building frontend image..."
cd ../frontend
docker build -t $FRONTEND_IMAGE .
echo "✅ Frontend image built"
echo ""

# Push images
echo "⬆️  Pushing images to GitHub Container Registry..."
docker push $BACKEND_IMAGE
echo "✅ Backend image pushed"
echo ""

docker push $FRONTEND_IMAGE
echo "✅ Frontend image pushed"
echo ""

echo "🎉 Done! Images are ready for deployment."
echo ""
echo "Next steps:"
echo "1. Go to VT Discovery Cluster GUI"
echo "2. Create/update deployments with these images:"
echo "   - Backend:  $BACKEND_IMAGE"
echo "   - Frontend: $FRONTEND_IMAGE"

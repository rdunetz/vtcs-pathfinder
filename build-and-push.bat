@echo off
REM Build and push script for VTCS PathFinder (Windows)
REM Usage: build-and-push.bat GITHUB_ORG_OR_USERNAME
REM Example: build-and-push.bat vtcs-pathfinder

if "%1"=="" (
    echo Error: GitHub organization/username not provided
    echo Usage: build-and-push.bat GITHUB_ORG_OR_USERNAME
    echo Example: build-and-push.bat vtcs-pathfinder
    exit /b 1
)

set GITHUB_ORG=%1
set BACKEND_IMAGE=ghcr.io/%GITHUB_ORG%/vtcs-pathfinder-backend:latest
set FRONTEND_IMAGE=ghcr.io/%GITHUB_ORG%/vtcs-pathfinder-frontend:latest

echo Building and pushing VTCS PathFinder images...
echo    Backend:  %BACKEND_IMAGE%
echo    Frontend: %FRONTEND_IMAGE%
echo.

REM Build backend
echo Building backend image...
cd backend
docker build -t %BACKEND_IMAGE% .
if %errorlevel% neq 0 exit /b %errorlevel%
echo Backend image built
echo.

REM Build frontend
echo Building frontend image...
cd ..\frontend
docker build -t %FRONTEND_IMAGE% .
if %errorlevel% neq 0 exit /b %errorlevel%
echo Frontend image built
echo.

REM Push images
echo Pushing images to GitHub Container Registry...
docker push %BACKEND_IMAGE%
if %errorlevel% neq 0 exit /b %errorlevel%
echo Backend image pushed
echo.

docker push %FRONTEND_IMAGE%
if %errorlevel% neq 0 exit /b %errorlevel%
echo Frontend image pushed
echo.

echo Done! Images are ready for deployment.
echo.
echo Next steps:
echo 1. Go to VT Discovery Cluster GUI
echo 2. Create/update deployments with these images:
echo    - Backend:  %BACKEND_IMAGE%
echo    - Frontend: %FRONTEND_IMAGE%

cd ..

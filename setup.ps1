# ExamMaster Pro - Quick Setup Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ExamMaster Pro - Quick Setup  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check for .env.local
Write-Host ""
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "! .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✓ Created .env.local from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Edit .env.local with your credentials before proceeding!" -ForegroundColor Red
    Write-Host "  Required:" -ForegroundColor Yellow
    Write-Host "  - DATABASE_URL (Neon PostgreSQL)" -ForegroundColor Yellow
    Write-Host "  - NEXTAUTH_SECRET (run: openssl rand -base64 32)" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_CLIENT_ID" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_CLIENT_SECRET" -ForegroundColor Yellow
    Write-Host "  - GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Have you updated .env.local? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please update .env.local and run this script again" -ForegroundColor Yellow
        exit 0
    }
}

# Generate Prisma Client
Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Push database schema
Write-Host ""
Write-Host "Pushing database schema..." -ForegroundColor Yellow
$pushDB = Read-Host "Do you want to push the schema to your database? (y/n)"
if ($pushDB -eq "y") {
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database schema pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to push database schema" -ForegroundColor Red
    }
}

# Seed database
Write-Host ""
$seedDB = Read-Host "Do you want to seed the database with sample data? (y/n)"
if ($seedDB -eq "y") {
    npx tsx prisma/seed.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "! Failed to seed database (optional)" -ForegroundColor Yellow
    }
}

# Setup complete
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉          " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start development server: npm run dev" -ForegroundColor White
Write-Host "2. Visit: http://localhost:3000" -ForegroundColor White
Write-Host "3. Sign in with Google" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  npm run dev        - Start development server" -ForegroundColor White
Write-Host "  npm run build      - Build for production" -ForegroundColor White
Write-Host "  npm start          - Start production server" -ForegroundColor White
Write-Host "  npx prisma studio  - Open database GUI" -ForegroundColor White
Write-Host ""

$startDev = Read-Host "Start development server now? (y/n)"
if ($startDev -eq "y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}

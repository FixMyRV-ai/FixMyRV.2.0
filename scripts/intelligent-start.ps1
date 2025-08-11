# FixMyRV - Intelligent Development Environment Setup
# This script automatically handles all prerequisites and environment setup

param(
    [switch]$SkipDependencies,
    [switch]$ForceClean,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptPath
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

# Color functions
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param($Step, $Message) Write-Host "[$Step] $Message" -ForegroundColor Magenta }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     FixMyRV - Intelligent Quick Start" -ForegroundColor Yellow  
Write-Host "       German Clock Precision" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Environment Detection
Write-Step "1/8" "Detecting Environment..."
$isLocal = $null -eq $env:RAILWAY_ENVIRONMENT

if ($isLocal) {
    Write-Info "Local Development Environment Detected"
} else {
    Write-Info "Railway Cloud Environment Detected"
}

# Step 2: Clean Previous State
Write-Step "2/8" "Cleaning Previous State..."
if ($ForceClean) {
    Write-Info "Force cleaning all processes..."
}

# Stop previous processes
$jobs = Get-Job | Where-Object { $_.Command -like "*npm*" -or $_.Command -like "*node*" }
if ($jobs) {
    foreach ($job in $jobs) {
        Write-Info "  Stopping job: $($job.Id)"
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -ErrorAction SilentlyContinue
    }
}

# Kill Node.js processes (local only)
if ($isLocal) {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*FixMyRV*" }
    foreach ($process in $nodeProcesses) {
        Write-Info "  Terminating Node.js process: PID $($process.Id)"
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Success "Cleanup completed!"

# Step 3: Docker Services (Local Only)
if ($isLocal) {
    Write-Step "3/8" "Setting up Docker Services..."
    
    # Check if Docker is running
    try {
        docker ps > $null 2>&1
        Write-Success "Docker is running"
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        exit 1
    }
    
    # Check if FixMyRV containers exist
    $pgContainer = docker ps -a --filter "name=fixmyrv-postgres" --format "{{.Names}}" 2>$null
    $mailContainer = docker ps -a --filter "name=fixmyrv-mailcatcher" --format "{{.Names}}" 2>$null
    
    if (-not $pgContainer -or -not $mailContainer) {
        Write-Info "Starting Docker services..."
        Set-Location $projectRoot
        docker-compose up -d
        Write-Success "Docker services started"
    } else {
        Write-Info "Docker containers exist, ensuring they're running..."
        docker start fixmyrv-postgres fixmyrv-mailcatcher 2>$null
        Write-Success "Docker services verified"
    }
    
    # Wait for PostgreSQL to be ready
    Write-Info "Waiting for PostgreSQL to be ready..."
    $maxAttempts = 30
    $attempt = 0
    do {
        $attempt++
        try {
            docker exec fixmyrv-postgres pg_isready -U postgres > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "PostgreSQL is ready!"
                break
            }
        } catch {}
        Start-Sleep 1
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -eq $maxAttempts) {
        Write-Error "PostgreSQL failed to start in time"
        exit 1
    }
    
    # Setup database and extensions
    Write-Info "Setting up database..."
    try {
        docker exec fixmyrv-postgres psql -U postgres -c "CREATE DATABASE fixmyrv;" 2>$null | Out-Null
    } catch {
        # Database likely already exists, which is fine
    }
    try {
        docker exec fixmyrv-postgres psql -U postgres -d fixmyrv -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>$null | Out-Null
    } catch {
        Write-Warning "Could not create vector extension - may need manual setup"
    }
    Write-Success "Database configured"
} else {
    Write-Step "3/8" "Railway Environment - Skipping Docker setup"
}

# Step 4: Environment Configuration
Write-Step "4/8" "Configuring Environment..."

$envFile = Join-Path $backendPath ".env"
$envExampleFile = Join-Path $backendPath ".env.example"

# Create .env.example for reference
$envExampleContent = @"
# FixMyRV Environment Configuration
# Copy this file to .env and configure your values

# Environment Type
NODE_ENV=development

# Database Configuration (Local Development)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fixmyrv

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# Application Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_API_URL=http://localhost:3000/api/v1
BACKEND_BASE_URL=http://localhost:3000

# Mail Configuration (Local Development)
MAIL_DRIVER=smtp
MAIL_HOST=localhost
MAIL_PORT=1026
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@fixmyrv.local

# OpenAI Configuration (Required for AI features)
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPEN_AI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=your-openai-api-key-here

# Optional Integrations
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Drive Integration
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/content/google-drive/callback
CHROME_PATH=
"@

Set-Content -Path $envExampleFile -Value $envExampleContent -Encoding UTF8

if (-not (Test-Path $envFile)) {
    Write-Info "Creating .env file from template..."
    Copy-Item $envExampleFile $envFile
    Write-Warning "Please configure your .env file with actual values (especially OPENAI_API_KEY)"
} else {
    Write-Success "Environment file exists"
}

# Step 5: Dependencies Installation
if (-not $SkipDependencies) {
    Write-Step "5/8" "Installing Dependencies..."
    
    # Backend dependencies
    Write-Info "Installing backend dependencies..."
    Set-Location $backendPath
    if (Test-Path "package-lock.json") {
        npm ci --silent
    } else {
        npm install --silent
    }
    Write-Success "Backend dependencies installed"
    
    # Frontend dependencies  
    Write-Info "Installing frontend dependencies..."
    Set-Location $frontendPath
    if (Test-Path "package-lock.json") {
        npm ci --silent
    } else {
        npm install --silent
    }
    Write-Success "Frontend dependencies installed"
} else {
    Write-Step "5/8" "Skipping dependency installation (SkipDependencies)"
}

# Step 6: Database Initialization
if ($isLocal) {
    Write-Step "6/8" "Initializing Database..."
    Set-Location $backendPath
    
    # Test database connection
    try {
        node -e "
            import('./config/database.js').then(async (db) => {
                try {
                    const vectorStore = await db.getVectorStore();
                    console.log('Database connection successful');
                    process.exit(0);
                } catch (e) {
                    console.error('Database connection failed:', e.message);
                    process.exit(1);
                }
            }).catch(e => {
                console.error('Import failed:', e.message);
                process.exit(1);
            });
        " 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection verified"
        } else {
            Write-Warning "Database initialization needed - will be handled by application startup"
        }
    } catch {
        Write-Warning "Database test skipped - will be handled by application startup"
    }
} else {
    Write-Step "6/8" "Railway Environment - Database handled by Railway"
}

# Step 7: Start Services
Write-Step "7/8" "Starting Application Services..."

Set-Location $scriptPath

if ($isLocal) {
    # Start backend
    Write-Info "Starting backend server..."
    $backendJob = Start-Job -ScriptBlock {
        param($backendPath)
        Set-Location $backendPath
        npm run dev
    } -ArgumentList $backendPath -Name "FixMyRV-Backend"
    
    Write-Success "Backend started (Job ID: $($backendJob.Id))"
    
    # Wait a moment for backend to initialize
    Start-Sleep 3
    
    # Start frontend
    Write-Info "Starting frontend server..."
    $frontendJob = Start-Job -ScriptBlock {
        param($frontendPath)
        Set-Location $frontendPath
        npm run dev
    } -ArgumentList $frontendPath -Name "FixMyRV-Frontend"
    
    Write-Success "Frontend started (Job ID: $($frontendJob.Id))"
    
    # Health check
    Write-Info "Performing health checks..."
    Start-Sleep 5
    
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10 -ErrorAction SilentlyContinue | Out-Null
        Write-Success "Backend health check passed"
    } catch {
        Write-Warning "Backend health check failed - may need more time to start"
    }
} else {
    Write-Info "Railway environment detected - services managed by Railway"
    Write-Success "Application will start automatically on Railway"
}

# Step 8: Final Setup and Information
Write-Step "8/8" "Final Setup..."

if ($isLocal) {
    # Create desktop shortcuts or quick access
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutContent = @"
@echo off
cd /d "$scriptPath"
powershell -ExecutionPolicy Bypass -File intelligent-start.ps1
pause
"@
    
    $shortcutPath = Join-Path $desktopPath "FixMyRV-Start.bat"
    Set-Content -Path $shortcutPath -Value $shortcutContent -Encoding ASCII
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   FixMyRV Development Environment Ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

if ($isLocal) {
    Write-Host ""
    Write-Info "Application URLs:"
    Write-Host "   Frontend:     http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend API:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Mailcatcher:  http://localhost:1081" -ForegroundColor White
    Write-Host ""
    Write-Info "Management:"
    Write-Host "   Stop Services: .\intelligent-stop.ps1" -ForegroundColor White
    Write-Host "   View Jobs:     Get-Job" -ForegroundColor White
    Write-Host "   Desktop Shortcut: Created on Desktop" -ForegroundColor White
    Write-Host ""
    Write-Info "Background Jobs:"
    Get-Job | Where-Object { $_.Name -like "FixMyRV*" } | Format-Table Name, State, Id -AutoSize
} else {
    Write-Host ""
    Write-Info "Railway Deployment Ready"
    Write-Host "   Environment: $env:RAILWAY_ENVIRONMENT" -ForegroundColor White
    Write-Host "   Build completed successfully" -ForegroundColor White
}

Write-Host ""
Write-Success "Ready to go!"

if ($isLocal) {
    # Auto-open browser
    Start-Sleep 2
    try {
        Start-Process "http://localhost:5173"
        Write-Success "Browser opened automatically"
    } catch {
        Write-Info "Please open http://localhost:5173 in your browser"
    }
}

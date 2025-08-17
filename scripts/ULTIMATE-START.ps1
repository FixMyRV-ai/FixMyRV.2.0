# ULTIMATE STARTUP SCRIPT - FIXES ALL COMMON ISSUES
# Run this instead of individual scripts

param(
    [switch]$Force,
    [switch]$Clean,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "🚀 ULTIMATE FixMyRV STARTUP - No More Daily Restarts!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Change to WebApp directory
Set-Location "C:\RiverWorksIT\Clients\Micheal Wojciak (Mike)\Proyects\FixMyRV\WebApp"

# Function to kill processes on specific ports
function Kill-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = netstat -ano | findstr ":$Port" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' }
        foreach ($pid in $processes) {
            if ($pid -and $pid -ne "0") {
                Write-Host "🔪 Killing process $pid on port $Port" -ForegroundColor Yellow
                taskkill /F /PID $pid 2>$null
            }
        }
    } catch {
        Write-Host "No processes found on port $Port" -ForegroundColor Gray
    }
}

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $result = netstat -ano | findstr ":$Port"
        return $result.Length -eq 0
    } catch {
        return $true
    }
}

# 1. CLEANUP PHASE
Write-Host "`n📧 Phase 1: Cleanup existing processes..." -ForegroundColor Green
Kill-ProcessOnPort 3000  # Backend
Kill-ProcessOnPort 5173  # Frontend
Kill-ProcessOnPort 5432  # Postgres (if local)

# Kill any hanging Node processes
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Cleaned up hanging Node processes" -ForegroundColor Green
} catch {
    Write-Host "No Node processes to clean" -ForegroundColor Gray
}

Start-Sleep 3

# 2. DOCKER PHASE
Write-Host "`n🐳 Phase 2: Starting Docker services..." -ForegroundColor Green
try {
    # Check if Docker is running
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }

    # Start database
    docker-compose up -d
    Write-Host "✅ Database container started" -ForegroundColor Green
    
    # Wait for database
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep 10
    
} catch {
    Write-Host "❌ Docker setup failed: $_" -ForegroundColor Red
    exit 1
}

# 3. BACKEND PHASE
Write-Host "`n⚙️ Phase 3: Starting Backend..." -ForegroundColor Green
Set-Location "backend"

# Check for environment file
if (!(Test-Path ".env")) {
    Write-Host "❌ Missing .env file in backend!" -ForegroundColor Red
    Write-Host "Please create backend/.env with your configuration" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (!(Test-Path "node_modules") -or $Clean) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend npm install failed!" -ForegroundColor Red
        exit 1
    }
}

# Start backend in background
Write-Host "🔄 Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\RiverWorksIT\Clients\Micheal Wojciak (Mike)\Proyects\FixMyRV\WebApp\backend"
    npx tsx watch server.ts
}

# Wait a bit and check if backend started
Start-Sleep 8
$backendRunning = Test-Port 3000
if ($backendRunning) {
    Write-Host "❌ Backend failed to start on port 3000" -ForegroundColor Red
    Receive-Job $backendJob
    exit 1
} else {
    Write-Host "✅ Backend running on port 3000" -ForegroundColor Green
}

# 4. FRONTEND PHASE
Write-Host "`n🎨 Phase 4: Starting Frontend..." -ForegroundColor Green
Set-Location "../frontend"

# Install dependencies if needed
if (!(Test-Path "node_modules") -or $Clean) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend npm install failed!" -ForegroundColor Red
        exit 1
    }
}

# Check TypeScript compilation
Write-Host "🔍 Checking TypeScript compilation..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation errors found!" -ForegroundColor Red
    Write-Host "Please fix TypeScript errors before starting" -ForegroundColor Red
    exit 1
}

# Start frontend in background
Write-Host "🔄 Starting frontend server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\RiverWorksIT\Clients\Micheal Wojciak (Mike)\Proyects\FixMyRV\WebApp\frontend"
    npm run dev
}

# Wait and check if frontend started
Start-Sleep 5
$frontendRunning = Test-Port 5173
if ($frontendRunning) {
    Write-Host "❌ Frontend failed to start on port 5173" -ForegroundColor Red
    Receive-Job $frontendJob
    exit 1
} else {
    Write-Host "✅ Frontend running on port 5173" -ForegroundColor Green
}

# 5. FINAL STATUS CHECK
Write-Host "`n🎯 Phase 5: Final Status Check..." -ForegroundColor Green

# Test backend health
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend API responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend API not responding yet (may still be starting)" -ForegroundColor Yellow
}

# Test frontend
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend not responding yet (may still be starting)" -ForegroundColor Yellow
}

# 6. SUCCESS MESSAGE
Write-Host "`n🎉 ULTIMATE STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "⚙️ Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "🐳 Database: PostgreSQL on port 5432" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "💡 To stop everything, run: .\scripts\ULTIMATE-STOP.ps1" -ForegroundColor Yellow
Write-Host "📋 Job IDs - Backend: $($backendJob.Id), Frontend: $($frontendJob.Id)" -ForegroundColor Gray

# Keep script running to show logs
Write-Host "`n📝 Monitoring logs (Ctrl+C to exit)..." -ForegroundColor Magenta
try {
    while ($true) {
        Start-Sleep 10
        # Show recent job output
        if ($Verbose) {
            Write-Host "--- Backend Output ---" -ForegroundColor DarkGray
            Receive-Job $backendJob -Keep | Select-Object -Last 3
            Write-Host "--- Frontend Output ---" -ForegroundColor DarkGray  
            Receive-Job $frontendJob -Keep | Select-Object -Last 3
        }
    }
} finally {
    Write-Host "`n🛑 Stopping monitoring..." -ForegroundColor Yellow
}

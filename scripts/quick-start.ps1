# FixMyRV - PowerShell Quick Start Script
# Usage: .\quick-start.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       FixMyRV - Quick Start Script" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "[0/4] Cleaning up any existing processes..." -ForegroundColor Red
Write-Host "Running quick-stop to ensure clean startup..." -ForegroundColor Yellow

# Stop PowerShell background jobs
$jobs = Get-Job | Where-Object { $_.Command -like "*npm run dev*" }
if ($jobs) {
    foreach ($job in $jobs) {
        Write-Host "  Stopping job: $($job.Id)" -ForegroundColor Blue
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -ErrorAction SilentlyContinue
    }
}

# Kill Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "  Terminating Node.js process: PID $($process.Id)" -ForegroundColor Blue
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

# Kill NPM processes
$npmProcesses = Get-Process -Name "*npm*" -ErrorAction SilentlyContinue
if ($npmProcesses) {
    foreach ($process in $npmProcesses) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

# Free development ports
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port "
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection.ToString().Trim() -split '\s+'
            if ($parts.Length -ge 5) {
                $processId = $parts[4]
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "✅ Cleanup completed!" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Checking PostgreSQL..." -ForegroundColor Green
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "PostgreSQL service found: $($pgService.Name) - Status: $($pgService.Status)" -ForegroundColor Blue
    if ($pgService.Status -ne "Running") {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service $pgService.Name -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "PostgreSQL service not found. Please ensure PostgreSQL is installed and running." -ForegroundColor Red
}
Write-Host ""

Write-Host "[2/4] Starting Backend Server..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\..\backend"
    npm run dev
}
Write-Host "Backend server starting (Job ID: $($backendJob.Id))" -ForegroundColor Blue

# Wait and check if backend job is still running
Start-Sleep -Seconds 5
$backendStatus = Get-Job -Id $backendJob.Id
if ($backendStatus.State -eq "Failed") {
    Write-Host "❌ Backend failed to start! Checking error..." -ForegroundColor Red
    Receive-Job -Id $backendJob.Id
    Write-Host "Please check the backend directory and try again." -ForegroundColor Yellow
    return
}
Write-Host "✅ Backend is starting up..." -ForegroundColor Green

Write-Host "[3/4] Starting Frontend Server..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\..\frontend"
    npm run dev
}
Write-Host "Frontend server starting (Job ID: $($frontendJob.Id))" -ForegroundColor Blue

# Wait and check if frontend job is still running
Start-Sleep -Seconds 5
$frontendStatus = Get-Job -Id $frontendJob.Id
if ($frontendStatus.State -eq "Failed") {
    Write-Host "❌ Frontend failed to start! Checking error..." -ForegroundColor Red
    Receive-Job -Id $frontendJob.Id
    Write-Host "Please check the frontend directory and try again." -ForegroundColor Yellow
    return
}
Write-Host "✅ Frontend is starting up..." -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Final Setup..." -ForegroundColor Green
Write-Host "Waiting for services to fully initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   FixMyRV Development Environment Started!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend Job ID:  $($backendJob.Id)" -ForegroundColor Gray
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""

Write-Host "Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Development servers are running as background jobs." -ForegroundColor Green
Write-Host "Use 'quick-stop.ps1' to terminate or check job status with 'Get-Job'" -ForegroundColor Blue
Write-Host ""

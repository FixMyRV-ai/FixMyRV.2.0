# ULTIMATE STOP SCRIPT 
param()

$ErrorActionPreference = "Continue"

Write-Host "🛑 ULTIMATE FixMyRV STOP SCRIPT" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = netstat -ano | findstr ":$Port" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' }
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                Write-Host "🔪 Stopping process $processId on port $Port" -ForegroundColor Yellow
                taskkill /F /PID $processId 2>$null
            }
        }
        Write-Host "✅ Port $Port cleared" -ForegroundColor Green
    } catch {
        Write-Host "No processes found on port $Port" -ForegroundColor Gray
    }
}

# Stop all services
Write-Host "`n📧 Stopping all FixMyRV services..." -ForegroundColor Yellow

Stop-ProcessOnPort 3000  # Backend
Stop-ProcessOnPort 5173  # Frontend

# Kill any Node processes
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ All Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No Node processes running" -ForegroundColor Gray
}

# Stop Docker containers (optional)
Write-Host "`n🐳 Stopping Docker containers..." -ForegroundColor Yellow
try {
    Set-Location "C:\RiverWorksIT\Clients\Micheal Wojciak (Mike)\Proyects\FixMyRV\WebApp"
    docker-compose down
    Write-Host "✅ Docker containers stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Docker containers may already be stopped" -ForegroundColor Yellow
}

Write-Host "`n🎉 ALL SERVICES STOPPED!" -ForegroundColor Green
Write-Host "You can now safely restart with .\scripts\ULTIMATE-START.ps1" -ForegroundColor Cyan

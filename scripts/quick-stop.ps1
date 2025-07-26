# FixMyRV - PowerShell Stop/Terminate Script
# Usage: .\quick-stop.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      FixMyRV - Stop/Terminate Script" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping PowerShell background jobs..." -ForegroundColor Yellow
$jobs = Get-Job | Where-Object { $_.Command -like "*npm run dev*" }
if ($jobs) {
    foreach ($job in $jobs) {
        Write-Host "Stopping job: $($job.Id) - $($job.Name)" -ForegroundColor Blue
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
    }
} else {
    Write-Host "No PowerShell jobs found." -ForegroundColor Gray
}

Write-Host "[2/5] Killing Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "Terminating Node.js process: PID $($process.Id)" -ForegroundColor Blue
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No Node.js processes found." -ForegroundColor Gray
}

Write-Host "[3/5] Killing NPM processes..." -ForegroundColor Yellow
$npmProcesses = Get-Process -Name "*npm*" -ErrorAction SilentlyContinue
if ($npmProcesses) {
    foreach ($process in $npmProcesses) {
        Write-Host "Terminating NPM process: PID $($process.Id)" -ForegroundColor Blue
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No NPM processes found." -ForegroundColor Gray
}

Write-Host "[4/5] Freeing development ports..." -ForegroundColor Yellow
$ports = @(3000, 5173)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port "
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection.ToString().Trim() -split '\s+'
            if ($parts.Length -ge 5) {
                $processId = $parts[4]
                Write-Host "Killing process on port ${port}: PID $processId" -ForegroundColor Blue
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "Port $port is free." -ForegroundColor Gray
    }
}

Write-Host "[5/5] Cleaning up development processes..." -ForegroundColor Yellow
$devProcesses = Get-Process -Name "*tsx*", "*vite*", "*webpack*" -ErrorAction SilentlyContinue
if ($devProcesses) {
    foreach ($process in $devProcesses) {
        Write-Host "Terminating dev process: $($process.Name) PID $($process.Id)" -ForegroundColor Blue
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No development processes found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "    All FixMyRV processes terminated!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend server stopped" -ForegroundColor Green
Write-Host "✅ Frontend server stopped" -ForegroundColor Green
Write-Host "✅ All Node.js processes killed" -ForegroundColor Green
Write-Host "✅ Ports 3000 and 5173 freed" -ForegroundColor Green
Write-Host "✅ Background jobs cleaned up" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run 'quick-start.ps1' or 'quick-start.bat' to restart." -ForegroundColor Blue
Write-Host ""

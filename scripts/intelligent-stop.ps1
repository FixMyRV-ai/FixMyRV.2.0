# FixMyRV - Intelligent Stop Script
# Gracefully stops all development services

param(
    [switch]$Force,
    [switch]$KeepDocker
)

$ErrorActionPreference = "Continue"

# Color functions
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Red
Write-Host "        FixMyRV - Intelligent Stop" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

# Stop PowerShell jobs
Write-Info "Stopping PowerShell background jobs..."
$fixMyRVJobs = Get-Job | Where-Object { $_.Name -like "FixMyRV*" -or $_.Command -like "*npm*" }
if ($fixMyRVJobs) {
    foreach ($job in $fixMyRVJobs) {
        Write-Info "  Stopping job: $($job.Name) (ID: $($job.Id))"
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Success "PowerShell jobs stopped"
} else {
    Write-Info "No FixMyRV background jobs found"
}

# Stop Node.js processes
Write-Info "Stopping Node.js processes..."
$ports = @(3000, 5173, 5174)
$stoppedProcesses = 0

foreach ($port in $ports) {
    $connections = netstat -ano 2>$null | Select-String ":$port " 
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection.ToString().Trim() -split '\s+'
            if ($parts.Length -ge 5) {
                $processId = $parts[4]
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process -and ($process.Name -eq "node" -or $process.Name -eq "npm")) {
                        Write-Info "  Stopping process on port $port (PID: $processId)"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        $stoppedProcesses++
                    }
                } catch {
                    Write-Warning "Could not stop process $processId"
                }
            }
        }
    }
}

if ($stoppedProcesses -gt 0) {
    Write-Success "Stopped $stoppedProcesses Node.js processes"
} else {
    Write-Info "No Node.js processes found on development ports"
}

# Kill any remaining FixMyRV Node processes
$remainingNodes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*FixMyRV*" }
if ($remainingNodes) {
    Write-Info "Cleaning up remaining FixMyRV Node.js processes..."
    foreach ($process in $remainingNodes) {
        Write-Info "  Terminating PID: $($process.Id)"
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Success "Remaining processes cleaned up"
}

# Docker services (optional)
if (-not $KeepDocker) {
    Write-Info "Stopping Docker services..."
    
    $scriptPath = $PSScriptRoot
    $projectRoot = Split-Path -Parent $scriptPath
    
    try {
        Set-Location $projectRoot
        
        # Check if docker-compose.yml exists
        if (Test-Path "docker-compose.yml") {
            # Stop and optionally remove containers
            if ($Force) {
                Write-Info "  Force removing Docker containers..."
                docker-compose down -v 2>$null
                Write-Success "Docker containers removed (including volumes)"
            } else {
                Write-Info "  Stopping Docker containers..."
                docker-compose stop 2>$null
                Write-Success "Docker containers stopped (use -Force to remove)"
            }
        } else {
            Write-Warning "docker-compose.yml not found, checking individual containers..."
            
            # Stop individual containers
            $containers = docker ps --filter "name=fixmyrv" --format "{{.Names}}" 2>$null
            if ($containers) {
                foreach ($container in $containers) {
                    Write-Info "  Stopping container: $container"
                    if ($Force) {
                        docker rm -f $container 2>$null
                    } else {
                        docker stop $container 2>$null
                    }
                }
                Write-Success "Individual containers handled"
            } else {
                Write-Info "No FixMyRV Docker containers found"
            }
        }
    } catch {
        Write-Warning "Docker operations failed: $($_.Exception.Message)"
    }
} else {
    Write-Info "Keeping Docker services running (KeepDocker flag)"
}

# Clean up temporary files (optional)
if ($Force) {
    Write-Info "Cleaning temporary files..."
    
    $tempPaths = @(
        "$env:TEMP\fixmyrv*",
        ".\logs\*.log",
        ".\*.log"
    )
    
    foreach ($path in $tempPaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Info "  Cleaned: $path"
            } catch {
                Write-Warning "Could not clean: $path"
            }
        }
    }
}

# Final status
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "        FixMyRV Services Stopped" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Info "Status Summary:"
Write-Host "  PowerShell Jobs: Stopped and removed" -ForegroundColor White
Write-Host "  Node.js Processes: Terminated" -ForegroundColor White

if (-not $KeepDocker) {
    if ($Force) {
        Write-Host "  Docker Containers: Removed (including volumes)" -ForegroundColor White
    } else {
        Write-Host "  Docker Containers: Stopped" -ForegroundColor White
    }
} else {
    Write-Host "  Docker Containers: Left running" -ForegroundColor White
}

if ($Force) {
    Write-Host "  Temporary Files: Cleaned" -ForegroundColor White
}

Write-Host ""
Write-Info "Usage Options:"
Write-Host "  Normal Stop:     .\intelligent-stop.ps1" -ForegroundColor Gray
Write-Host "  Keep Docker:     .\intelligent-stop.ps1 -KeepDocker" -ForegroundColor Gray
Write-Host "  Force Clean:     .\intelligent-stop.ps1 -Force" -ForegroundColor Gray
Write-Host ""
Write-Success "Ready for next start!"

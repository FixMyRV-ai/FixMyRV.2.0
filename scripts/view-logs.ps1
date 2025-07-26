# FixMyRV - Log Viewer Script
# Shows recent Twilio logs from both database and file system

param(
    [int]$Lines = 10,
    [string]$BackendUrl = "http://localhost:3000"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       FixMyRV - Twilio Log Viewer" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
try {
    Write-Host "🔍 Checking backend connection..." -ForegroundColor Blue
    $healthCheck = Invoke-RestMethod -Uri "$BackendUrl/api/v1/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to backend at $BackendUrl" -ForegroundColor Red
    Write-Host "   Make sure the backend server is running" -ForegroundColor Yellow
    return
}

# Get logs from API
try {
    Write-Host ""
    Write-Host "📊 Recent Twilio Logs from Database:" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Gray
    
    $logs = Invoke-RestMethod -Uri "$BackendUrl/api/v1/twilio/logs?limit=$Lines" -Method GET
    
    if ($logs.success -and $logs.data.logs.Count -gt 0) {
        foreach ($log in $logs.data.logs) {
            $timestamp = [DateTime]::Parse($log.createdAt).ToString("yyyy-MM-dd HH:mm:ss")
            $status = switch ($log.status) {
                "received" { "[RCVD]" }
                "processed" { "[PROC]" }
                "failed" { "[FAIL]" }
                "error" { "[ERR]" }
                default { "[$($log.status.ToUpper())]" }
            }
            
            $testFlag = if ($log.isTestMessage) { " [TEST]" } else { "" }
            $location = ""
            
            # Try to extract location from rawPayload
            if ($log.rawPayload) {
                $payload = $log.rawPayload | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($payload.FromCity -and $payload.FromState) {
                    $location = " from $($payload.FromCity), $($payload.FromState)"
                }
            }
            
            Write-Host "$timestamp $status$testFlag" -ForegroundColor White
            Write-Host "  Phone: $($log.fromNumber) -> $($log.toNumber)$location" -ForegroundColor Gray
            Write-Host "  Message: $($log.messageBody.Substring(0, [Math]::Min(80, $log.messageBody.Length)))..." -ForegroundColor Cyan
            Write-Host "  SID: $($log.messageSid)" -ForegroundColor DarkGray
            
            if ($log.processingTimeMs) {
                Write-Host "  Time: Processed in $($log.processingTimeMs)ms" -ForegroundColor DarkGray
            }
            Write-Host ""
        }
        
        Write-Host "Total logs in database: $($logs.data.total)" -ForegroundColor Yellow
    } else {
        Write-Host "No logs found in database" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error fetching logs from API: $($_.Exception.Message)" -ForegroundColor Red
}

# Check file logs
Write-Host ""
Write-Host "📄 Recent File Logs:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Gray

$logDir = Join-Path (Get-Location) "..\backend\logs"
$todayLog = Join-Path $logDir "twilio-$(Get-Date -Format 'yyyy-MM-dd').log"

if (Test-Path $todayLog) {
    Write-Host "Log file: $todayLog" -ForegroundColor Blue
    
    $fileLines = Get-Content $todayLog -Tail $Lines -ErrorAction SilentlyContinue
    if ($fileLines) {
        foreach ($line in $fileLines) {
            try {
                $logEntry = $line | ConvertFrom-Json
                $timestamp = [DateTime]::Parse($logEntry.timestamp).ToString("HH:mm:ss")
                $testFlag = if ($logEntry.isTest) { " [TEST]" } else { "" }
                
                $locationStr = ""
                if ($logEntry.location -and $logEntry.location.from -and $logEntry.location.from.city) {
                    $locationStr = " ($($logEntry.location.from.city), $($logEntry.location.from.state))"
                }
                
                Write-Host "$timestamp $($logEntry.status.ToUpper())$testFlag$locationStr" -ForegroundColor White
                Write-Host "  Phone: $($logEntry.from) -> $($logEntry.to)" -ForegroundColor Gray
                Write-Host "  Message: $($logEntry.body.Substring(0, [Math]::Min(60, $logEntry.body.Length)))..." -ForegroundColor Cyan
                
                if ($logEntry.metadata) {
                    $metaInfo = @()
                    if ($logEntry.metadata.smsStatus) { $metaInfo += "Status: $($logEntry.metadata.smsStatus)" }
                    if ($logEntry.metadata.numSegments) { $metaInfo += "Segments: $($logEntry.metadata.numSegments)" }
                    if ($logEntry.metadata.apiVersion) { $metaInfo += "API: $($logEntry.metadata.apiVersion)" }
                    
                    if ($metaInfo.Count -gt 0) {
                        Write-Host "  Meta: $($metaInfo -join ' | ')" -ForegroundColor DarkGray
                    }
                }
                Write-Host ""
            } catch {
                Write-Host "  Invalid log line: $line" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  No entries in today's log file" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No log file found for today" -ForegroundColor Yellow
    
    # Check for any log files
    if (Test-Path $logDir) {
        $logFiles = Get-ChildItem $logDir -Filter "twilio-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 3
        if ($logFiles) {
            Write-Host ""
            Write-Host "  Recent log files found:" -ForegroundColor Blue
            foreach ($file in $logFiles) {
                Write-Host "    - $($file.Name) ($($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Use the frontend log viewer for detailed analysis:" -ForegroundColor Green
Write-Host "   http://localhost:5173 (Admin > Twilio Logs)" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Cyan

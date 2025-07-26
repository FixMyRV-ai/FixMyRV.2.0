# FixMyRV - Generate Comprehensive Test Dataset
# This script creates a realistic dataset for testing the Twilio log viewer

param(
    [string]$BackendUrl = "http://localhost:3000"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Creating Comprehensive Test Dataset" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Generate different scenarios
$scenarios = @(
    @{ Description = "Emergency messages"; Count = 3; Type = "Emergency" },
    @{ Description = "Urgent support requests"; Count = 5; Type = "Urgent" },
    @{ Description = "Regular inquiries"; Count = 15; Type = "Normal" },
    @{ Description = "Follow-up messages"; Count = 4; Type = "Followup" },
    @{ Description = "Thank you messages"; Count = 3; Type = "Thanks" }
)

Write-Host "Generating comprehensive test dataset..." -ForegroundColor Green
Write-Host ""

$totalGenerated = 0

foreach ($scenario in $scenarios) {
    Write-Host "Creating $($scenario.Count) $($scenario.Description)..." -ForegroundColor Yellow
    
    & ".\generate-twilio-test-logs.ps1" -Count $scenario.Count -BackendUrl $BackendUrl
    
    $totalGenerated += $scenario.Count
    Start-Sleep -Seconds 1
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Dataset Generation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total test messages generated: $totalGenerated" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Your Twilio log viewer now has comprehensive test data!" -ForegroundColor Green
Write-Host "   View them at: http://localhost:5173 (Admin > Twilio Logs)" -ForegroundColor Blue
Write-Host ""

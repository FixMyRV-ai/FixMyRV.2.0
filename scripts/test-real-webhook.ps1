# FixMyRV - Real Twilio Webhook Format Tester
# This script tests the actual webhook endpoint with realistic Twilio format
# Usage: .\test-real-webhook.ps1

param(
    [string]$BackendUrl = "http://localhost:3000",
    [int]$Count = 3
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Testing Real Twilio Webhook Endpoint" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Sample realistic webhook payloads based on your example
$sampleWebhooks = @(
    @{
        ToCountry = "US"
        ToState = "OH"
        SmsMessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        NumMedia = "0"
        ToCity = "COLUMBUS"
        FromZip = "78216"
        SmsSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        FromState = "TX"
        SmsStatus = "received"
        FromCity = "SAN ANTONIO"
        Body = "Emergency! My RV engine is overheating on I-35!"
        FromCountry = "US"
        To = "+16144678149"
        ToZip = "43203"
        NumSegments = "1"
        MessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        AccountSid = "ACe6b5f98fe1cac6466c45d38169664043"
        From = "+12103439989"
        ApiVersion = "2010-04-01"
    },
    @{
        ToCountry = "US"
        ToState = "OH"
        SmsMessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        NumMedia = "0"
        ToCity = "COLUMBUS"
        FromZip = "33101"
        SmsSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        FromState = "FL"
        SmsStatus = "received"
        FromCity = "MIAMI"
        Body = "Hi FixMyRV! My RV's AC stopped working in this Florida heat. Please help!"
        FromCountry = "US"
        To = "+16144678149"
        ToZip = "43203"
        NumSegments = "1"
        MessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        AccountSid = "ACe6b5f98fe1cac6466c45d38169664043"
        From = "+13055551234"
        ApiVersion = "2010-04-01"
    },
    @{
        ToCountry = "US"
        ToState = "OH"
        SmsMessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        NumMedia = "0"
        ToCity = "COLUMBUS"
        FromZip = "85001"
        SmsSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        FromState = "AZ"
        SmsStatus = "received"
        FromCity = "PHOENIX"
        Body = "Thank you for yesterday's help! My RV generator is working perfectly now."
        FromCountry = "US"
        To = "+16144678149"
        ToZip = "43203"
        NumSegments = "1"
        MessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        AccountSid = "ACe6b5f98fe1cac6466c45d38169664043"
        From = "+16025559876"
        ApiVersion = "2010-04-01"
    }
)

Write-Host "Testing real webhook endpoint with $Count realistic payloads..." -ForegroundColor Green
Write-Host "Webhook URL: $BackendUrl/api/v1/twilio/webhook/sms" -ForegroundColor Blue
Write-Host ""

$successCount = 0
$errorCount = 0

for ($i = 1; $i -le $Count; $i++) {
    try {
        $webhook = $sampleWebhooks[($i - 1) % $sampleWebhooks.Count]
        
        # Update MessageSid to be unique for each test
        $webhook.MessageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        $webhook.SmsMessageSid = $webhook.MessageSid
        $webhook.SmsSid = $webhook.MessageSid
        
        # Convert to form data (application/x-www-form-urlencoded) like real Twilio webhooks
        $formData = @()
        foreach ($key in $webhook.Keys) {
            $formData += "$key=$([System.Web.HttpUtility]::UrlEncode($webhook[$key]))"
        }
        $body = $formData -join "&"

        # Send POST request to real webhook endpoint
        $headers = @{
            'Content-Type' = 'application/x-www-form-urlencoded'
            'User-Agent' = 'TwilioProxy/1.1'
        }
        
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/v1/twilio/webhook/sms" -Method POST -Body $body -Headers $headers
        
        if ($response.success) {
            $successCount++
            Write-Host "[$i/$Count] ✅ Real webhook test successful" -ForegroundColor Green
            Write-Host "    From: $($webhook.From) ($($webhook.FromCity), $($webhook.FromState))" -ForegroundColor Gray
            Write-Host "    Message: $($webhook.Body.Substring(0, [Math]::Min(60, $webhook.Body.Length)))..." -ForegroundColor Gray
            Write-Host "    MessageSid: $($webhook.MessageSid)" -ForegroundColor Gray
        } else {
            $errorCount++
            Write-Host "[$i/$Count] ❌ Real webhook test failed: $($response.message)" -ForegroundColor Red
        }

        Start-Sleep -Milliseconds (Get-Random -Minimum 200 -Maximum 800)

    } catch {
        $errorCount++
        Write-Host "[$i/$Count] ❌ Error testing real webhook: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     Real Webhook Testing Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total webhook tests: $Count" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $errorCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "✅ Real webhook endpoint is working correctly!" -ForegroundColor Green
    Write-Host "   Check logs at: http://localhost:5173 (Admin > Twilio Logs)" -ForegroundColor Blue
} else {
    Write-Host "❌ Real webhook endpoint tests failed." -ForegroundColor Red
    Write-Host "   Check Twilio settings and backend logs for issues." -ForegroundColor Yellow
}

Write-Host ""

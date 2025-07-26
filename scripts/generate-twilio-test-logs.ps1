# FixMyRV - Twilio Test Log Generator
# Usage: .\generate-twilio-test-logs.ps1 [count]

param(
    [int]$Count = 10,
    [string]$BackendUrl = "http://localhost:3000"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Twilio Test Log Generator for FixMyRV" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Sample phone numbers for testing
$phoneNumbers = @(
    "+15551234567",
    "+15559876543",
    "+15555555555",
    "+15551111111",
    "+15552222222",
    "+15553333333",
    "+15554444444",
    "+15556666666",
    "+15557777777",
    "+15558888888"
)

# Sample RV-related messages for realistic testing
$sampleMessages = @(
    "Hi! My RV's air conditioning isn't working properly. Can you help?",
    "I need assistance with my RV's electrical system. The lights keep flickering.",
    "My RV's water pump is making strange noises. What should I do?",
    "Help! My RV won't start. I think it's a battery issue.",
    "The refrigerator in my RV stopped cooling. Any suggestions?",
    "I'm having trouble with my RV's slide-out mechanism.",
    "My RV's generator won't turn on. Can you provide guidance?",
    "The toilet in my RV is not flushing properly. Need help!",
    "I smell gas in my RV. Is this an emergency?",
    "My RV's awning is stuck. How can I fix this?",
    "The heating system in my RV is not working.",
    "I have a leak in my RV's roof. What's the best temporary fix?",
    "My RV's tires look worn. How do I know when to replace them?",
    "The steps on my RV won't retract. Any ideas?",
    "I'm getting an error code on my RV's control panel.",
    "My RV's solar panels aren't charging the batteries.",
    "The water heater in my RV is not heating water.",
    "I need help connecting my RV to shore power.",
    "My RV's black tank sensor is reading wrong.",
    "The TV antenna on my RV broke. How can I fix it?",
    "Emergency! My RV is smoking near the engine compartment!",
    "Thank you for the quick response! The issue is resolved.",
    "Can you recommend a good RV repair shop in Arizona?",
    "What's the best way to winterize my RV?",
    "I'm having issues with my RV's leveling jacks."
)

# Different message priorities/types
$messageTypes = @(
    @{ Type = "Emergency"; Messages = @(
        "EMERGENCY! My RV is on fire!",
        "Help! I'm stranded on the highway with my RV!",
        "Urgent: Gas leak detected in my RV!",
        "Emergency: RV brake failure!"
    )},
    @{ Type = "Urgent"; Messages = @(
        "My RV won't start and I need to leave soon.",
        "Water leak inside the RV - need immediate help!",
        "RV electrical system completely down.",
        "Cannot get into my RV - door lock issue."
    )},
    @{ Type = "Normal"; Messages = $sampleMessages }
)

Write-Host "Generating $Count random Twilio test messages..." -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Blue
Write-Host ""

$successCount = 0
$errorCount = 0

for ($i = 1; $i -le $Count; $i++) {
    try {
        # Randomly select message type (weighted towards normal messages)
        $rand = Get-Random -Minimum 1 -Maximum 100
        if ($rand -le 5) {
            $selectedType = $messageTypes[0] # Emergency (5%)
        } elseif ($rand -le 20) {
            $selectedType = $messageTypes[1] # Urgent (15%)
        } else {
            $selectedType = $messageTypes[2] # Normal (80%)
        }

        # Select random message and phone number
        $randomMessage = $selectedType.Messages | Get-Random
        $randomFromNumber = $phoneNumbers | Get-Random
        $randomToNumber = "+15551234000" # Your RV service number

        # Add some variation to messages
        $variations = @(
            "Please help: $randomMessage",
            "$randomMessage Thanks!",
            "Hi, $randomMessage",
            "$randomMessage - urgent please!",
            "$randomMessage"
        )
        $finalMessage = $variations | Get-Random

        # Create realistic Twilio webhook payload structure
        $messageSid = "SM$(Get-Date -Format 'yyyyMMddHHmmss')$(Get-Random -Minimum 1000 -Maximum 9999)"
        $accountSid = "YOUR_TWILIO_ACCOUNT_SID_HERE" # Sample AccountSid
        
        # Sample geographic data for variety
        $locations = @(
            @{ State = "TX"; City = "SAN ANTONIO"; Zip = "78216"; Country = "US" },
            @{ State = "FL"; City = "MIAMI"; Zip = "33101"; Country = "US" },
            @{ State = "CA"; City = "LOS ANGELES"; Zip = "90210"; Country = "US" },
            @{ State = "AZ"; City = "PHOENIX"; Zip = "85001"; Country = "US" },
            @{ State = "NV"; City = "LAS VEGAS"; Zip = "89101"; Country = "US" },
            @{ State = "CO"; City = "DENVER"; Zip = "80202"; Country = "US" },
            @{ State = "OR"; City = "PORTLAND"; Zip = "97201"; Country = "US" },
            @{ State = "WA"; City = "SEATTLE"; Zip = "98101"; Country = "US" }
        )
        
        $fromLocation = $locations | Get-Random
        $toLocation = @{ State = "OH"; City = "COLUMBUS"; Zip = "43203"; Country = "US" }
        
        $testPayload = @{
            # Simulate realistic Twilio webhook structure
            ToCountry = $toLocation.Country
            ToState = $toLocation.State
            SmsMessageSid = $messageSid
            NumMedia = "0"
            ToCity = $toLocation.City
            FromZip = $fromLocation.Zip
            SmsSid = $messageSid
            FromState = $fromLocation.State
            SmsStatus = "received"
            FromCity = $fromLocation.City
            Body = $finalMessage
            FromCountry = $fromLocation.Country
            To = $randomToNumber
            ToZip = $toLocation.Zip
            NumSegments = "1"
            MessageSid = $messageSid
            AccountSid = $accountSid
            From = $randomFromNumber
            ApiVersion = "2010-04-01"
        } | ConvertTo-Json

        # Send POST request to test endpoint
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/v1/twilio/test/sms" -Method POST -Body $testPayload -ContentType "application/json"
        
        if ($response.success) {
            $successCount++
            Write-Host "[$i/$Count] ✅ Test message sent successfully" -ForegroundColor Green
            Write-Host "    From: $randomFromNumber" -ForegroundColor Gray
            Write-Host "    Message: $($finalMessage.Substring(0, [Math]::Min(50, $finalMessage.Length)))..." -ForegroundColor Gray
            Write-Host "    MessageSid: $($response.data.messageSid)" -ForegroundColor Gray
        } else {
            $errorCount++
            Write-Host "[$i/$Count] ❌ Failed to send test message: $($response.message)" -ForegroundColor Red
        }

        # Add small delay between requests to avoid overwhelming the server
        Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 500)

    } catch {
        $errorCount++
        Write-Host "[$i/$Count] ❌ Error sending test message: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "         Test Log Generation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total messages attempted: $Count" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $errorCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "✅ Check your Twilio log viewer to see the test messages!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:5173 (Admin > Twilio Logs)" -ForegroundColor Blue
} else {
    Write-Host "❌ No test messages were generated successfully." -ForegroundColor Red
    Write-Host "   Make sure the backend server is running on $BackendUrl" -ForegroundColor Yellow
}

Write-Host ""

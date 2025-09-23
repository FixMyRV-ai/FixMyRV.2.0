# Twilio SMS Webhook API Documentation

## Overview
This API endpoint receives incoming SMS messages from Twilio and processes them through the FixMyRV AI chatbot system.

## Endpoint
```
POST https://{BACKEND_BASE_URL}/api/v1/twilio/webhook/sms
```

## Authentication
- **Method**: Twilio Signature Validation
- **Header**: `X-Twilio-Signature`
- **Validation**: Uses Twilio Auth Token to verify request authenticity

## Request Format
**Content-Type**: `application/x-www-form-urlencoded`

### Required Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `MessageSid` | String | Unique message identifier | `<TWILIO_MESSAGE_SID>` |
| `AccountSid` | String | Twilio Account SID | `<TWILIO_ACCOUNT_SID>` |
| `From` | String | Sender's phone number (E.164) | `+15551234567` |
| `To` | String | Twilio phone number (E.164) | `+15559876543` |
| `Body` | String | SMS message content | `My RV air conditioner is not cooling` |
| `NumMedia` | String | Number of media attachments | `0` |

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `X-Twilio-Signature` | Yes | Twilio webhook signature for validation |
| `Content-Type` | Yes | `application/x-www-form-urlencoded` |

## Response Format
Twilio accepts an empty 200 OK or plain text. For this service we return 200 OK with an empty body to avoid content-type issues.

### Success Response (200 OK)
200 OK (empty body)

### Error Responses

#### 403 Forbidden - Invalid Signature
403 with plain text body: Invalid signature

#### 403 Forbidden - Invalid Account
403 with plain text body: Invalid AccountSid

#### 500 Internal Server Error
500 with plain text body: Twilio settings not configured

## Message Processing Flow

### 1. Opt-in Messages
**Trigger Keywords**: `YES`, `Y`, `OK`, `OKAY`, `CONFIRM`, `OPT IN`, `OPTIN`

**Process**:
- Updates user status to 'active'
- Sends welcome message
- Enables chat functionality

**Response**: Welcome message sent via SMS

### 2. Chat Messages (Active Users Only)
**Requirements**:
- User must exist in `OrganizationUser` table
- User status must be 'active' (opted in)

**Process**:
1. Finds or creates SMS chat session
2. Saves user message to database
3. Generates AI response using LangChain/OpenAI
4. Splits long responses into SMS-sized chunks
5. Sends AI response back to user

**Response**: AI-generated response sent via SMS

### 3. Stop Messages
**Trigger Keywords**: `STOP`, `UNSUBSCRIBE`, `QUIT`, `CANCEL`, `END`

**Process**:
- Updates user status to 'inactive'
- Stops future message processing

**Response**: Confirmation message

## Example Requests

### Curl Example
```bash
curl -X POST https://{BACKEND_BASE_URL}/api/v1/twilio/webhook/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: your-signature-here" \
  -d "MessageSid=<TWILIO_MESSAGE_SID>" \
  -d "AccountSid=<TWILIO_ACCOUNT_SID>" \
  -d "From=%2B15551234567" \
  -d "To=%2B15559876543" \
  -d "Body=My RV air conditioner is not cooling properly" \
  -d "NumMedia=0"
```

### PowerShell Example
```powershell
$body = @{
    MessageSid = "SM1234567890abcdef1234567890abcdef"
    AccountSid = "AC1234567890abcdef1234567890abcdef"
    From = "+15551234567"
    To = "+15559876543"
    Body = "My RV air conditioner is not cooling properly"
    NumMedia = "0"
}

$headers = @{
    "X-Twilio-Signature" = "your-signature-here"
}

Invoke-RestMethod -Uri "https://{BACKEND_BASE_URL}/api/v1/twilio/webhook/sms" `
    -Method Post -Body $body -Headers $headers
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

const data = new URLSearchParams({
  MessageSid: '<TWILIO_MESSAGE_SID>',
  AccountSid: '<TWILIO_ACCOUNT_SID>',
    From: '+15551234567',
    To: '+15559876543',
    Body: 'My RV air conditioner is not cooling properly',
    NumMedia: '0'
});

const response = await axios.post(
  'https://{BACKEND_BASE_URL}/api/v1/twilio/webhook/sms',
    data,
    {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Twilio-Signature': 'your-signature-here'
        }
    }
);
```

## Twilio Configuration

### Phone Number Settings
1. Navigate to **Phone Numbers** in Twilio Console
2. Select your Twilio phone number
3. Configure webhook for **"A message comes in"**:
  - **Webhook URL**: `https://{BACKEND_BASE_URL}/api/v1/twilio/webhook/sms`
   - **HTTP Method**: POST

### Security Settings
- Ensure webhook signature validation is enabled
- Use HTTPS for webhook URL
- Validate the signature in production environments

## Database Requirements

### Organization Users
Users must be registered in the `OrganizationUser` table with:
- Phone number matching the `From` parameter
- Valid organization association
- Initial status can be 'invited' or 'pending'

### Twilio Settings
System requires configured `TwilioSetting` record with:
- Account SID
- Auth Token  
- Phone Number
- Webhook configuration

## Error Handling
- All webhook calls are logged in `TwilioLog` table
- Failed processing attempts are recorded with error details
- Processing time metrics are tracked
- Automatic retry logic for transient failures

## Rate Limiting
- Implements small delays between multiple SMS responses (500ms)
- Handles message chunking for responses exceeding SMS limits
- Maintains proper message ordering

## Testing

### Development Test Endpoint
Use the test endpoint for development:
```
POST /api/v1/twilio/test/sms
```
This endpoint accepts the same parameters but bypasses signature validation for local testing.

### Status Endpoint
Check webhook configuration:
```
GET /api/v1/twilio/webhook/status
```

### Logs Endpoint
View webhook logs:
```
GET /api/v1/twilio/logs
```

## Common Issues

### 404 Not Found
- **Cause**: Backend API not running on Railway
- **Solution**: Ensure Railway is properly deploying the Node.js backend

### 403 Invalid Signature
- **Cause**: Webhook signature validation failed
- **Solution**: Verify Twilio Auth Token and webhook URL configuration

### User Not Found
- **Cause**: Phone number not registered in system
- **Solution**: Add user to `OrganizationUser` table before sending SMS

### User Not Active
- **Cause**: User hasn't opted in yet
- **Solution**: User must reply "YES" to invitation SMS first

## Message Flow Examples

### New User Invitation
1. **Admin sends invitation** → User receives SMS
2. **User replies "YES"** → System sets status to 'active'
3. **System sends welcome message** → User can now chat

### Active User Chat
1. **User sends "My generator won't start"** → System processes message
2. **AI generates response** → System splits into SMS chunks if needed
3. **System sends response** → User receives troubleshooting steps

### User Opt-out
1. **User sends "STOP"** → System sets status to 'inactive'
2. **System sends confirmation** → Future messages ignored

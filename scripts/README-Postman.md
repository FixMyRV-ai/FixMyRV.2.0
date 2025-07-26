# FixMyRV - Postman Collection for Twilio Testing

This comprehensive Postman collection allows you to test all FixMyRV Twilio webhook endpoints with realistic data.

## 📁 Files Included

1. **`FixMyRV-Twilio-Postman-Collection.json`** - Main collection with all endpoints
2. **`FixMyRV-Development-Environment.postman_environment.json`** - Environment variables
3. **`README-Postman.md`** - This documentation

## 🚀 Quick Setup

### Step 1: Import Collection
1. Open Postman
2. Click **Import** 
3. Select `FixMyRV-Twilio-Postman-Collection.json`
4. Collection will appear in your sidebar

### Step 2: Import Environment
1. Click **Import** again
2. Select `FixMyRV-Development-Environment.postman_environment.json`
3. Select the **FixMyRV - Development Environment** from the environment dropdown

### Step 3: Verify Backend
1. Make sure your FixMyRV backend is running on `http://localhost:3000`
2. Run the **Health Check** request to verify connectivity

## 📋 Available Endpoints

### 🔍 **Health Check**
- **Method:** GET
- **URL:** `/api/v1/health`
- **Purpose:** Verify backend is running

### 🧪 **Twilio Test Endpoint - Simple Format**
- **Method:** POST
- **URL:** `/api/v1/twilio/test/sms`
- **Content-Type:** `application/json`
- **Purpose:** Quick testing with minimal data
- **Body:**
```json
{
  "from": "+15551234567",
  "to": "{{rvServiceNumber}}",
  "body": "Hi FixMyRV! My RV's generator won't start. Can you help?"
}
```

### 🧪 **Twilio Test Endpoint - Full Realistic Format**
- **Method:** POST
- **URL:** `/api/v1/twilio/test/sms`
- **Content-Type:** `application/json`
- **Purpose:** Test with complete Twilio webhook structure
- **Includes:** Geographic data, SMS status, segments, API version

### 🎯 **Real Twilio Webhook - Emergency**
- **Method:** POST
- **URL:** `/api/v1/twilio/webhook/sms`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Purpose:** Simulate actual Twilio webhook for emergency
- **From:** Miami, FL
- **Message:** "EMERGENCY! My RV is on fire in Miami! Please send help immediately!"

### 🎯 **Real Twilio Webhook - Normal Support**
- **Method:** POST
- **URL:** `/api/v1/twilio/webhook/sms`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Purpose:** Simulate normal support request
- **From:** Phoenix, AZ
- **Message:** AC troubleshooting request

### 🎯 **Real Twilio Webhook - Thank You Message**
- **Method:** POST
- **URL:** `/api/v1/twilio/webhook/sms`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Purpose:** Simulate customer appreciation
- **From:** Denver, CO
- **Message:** Thank you for generator help

### 📊 **Get Twilio Logs**
- **Method:** GET
- **URL:** `/api/v1/twilio/logs?limit=10&page=1`
- **Purpose:** Retrieve logged messages from database

### ⚙️ **Get Webhook Status**
- **Method:** GET
- **URL:** `/api/v1/twilio/webhook/status`
- **Purpose:** Check webhook configuration

## 🔧 Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | Backend server URL |
| `accountSid` | `YOUR_TWILIO_ACCOUNT_SID_HERE` | Twilio Account SID |
| `rvServiceNumber` | `+16144678149` | FixMyRV service phone number |
| `testFromNumber1` | `+12103439989` | Test customer number (San Antonio) |
| `testFromNumber2` | `+13055551234` | Test customer number (Miami) |
| `testFromNumber3` | `+16025559876` | Test customer number (Phoenix) |
| `testFromNumber4` | `+17205551111` | Test customer number (Denver) |

## 🎯 Testing Scenarios

### **Emergency Response Testing**
1. Use "Real Twilio Webhook - Emergency"
2. Check logs for proper emergency flagging
3. Verify processing time is minimal

### **Geographic Data Testing**
1. Run different webhook requests (Miami, Phoenix, Denver)
2. Check logs show correct geographic information
3. Verify location data is captured in database

### **Load Testing**
1. Run multiple requests in sequence
2. Use Postman Collection Runner for bulk testing
3. Monitor response times and success rates

### **Database Integration Testing**
1. Send webhook requests
2. Use "Get Twilio Logs" to verify database storage
3. Check that geographic data is preserved

## 🚨 Troubleshooting

### Backend Not Responding
- Verify backend is running: `npm run dev` in backend folder
- Check URL in environment: should be `http://localhost:3000`
- Run Health Check request first

### Webhook Signature Errors
- Development mode skips signature validation
- For production testing, you'll need real Twilio signatures

### Database Errors
- Ensure PostgreSQL is running
- Check database configuration in backend
- Verify Twilio settings are configured in admin panel

## 🔄 Auto-Generated Data

The collection includes smart features:
- **Auto-generated MessageSids** using Postman variables
- **Randomized data** for realistic testing
- **Consistent timestamps** for proper sequencing
- **Automatic test assertions** for response validation

## 📈 Response Examples

### Successful Test Response
```json
{
  "success": true,
  "message": "Test SMS simulated and logged",
  "data": {
    "messageSid": "SM202507260725122391",
    "processed": true,
    "timestamp": "2025-07-26T07:25:15.000Z",
    "processingTimeMs": 25,
    "isTest": true,
    "format": "full-twilio"
  }
}
```

### Successful Webhook Response
```json
{
  "success": true,
  "message": "SMS webhook processed successfully",
  "data": {
    "messageSid": "SM202507260725122391",
    "processed": true,
    "timestamp": "2025-07-26T07:25:15.000Z",
    "processingTimeMs": 15,
    "location": "PHOENIX, AZ"
  }
}
```

## 🎮 Usage Tips

1. **Start with Health Check** - Always verify backend connectivity first
2. **Use Simple Format** - For quick testing and debugging
3. **Test Real Webhooks** - Use form-encoded requests for production-like testing
4. **Check Logs** - Use the logs endpoint to verify data persistence
5. **Monitor Geographic Data** - Ensure location information is captured
6. **Test Different Scenarios** - Emergency, normal support, thank you messages

## 🔗 Related Resources

- **Frontend Log Viewer:** http://localhost:5173 (Admin > Twilio Logs)
- **Backend API Documentation:** Available in your backend codebase
- **PowerShell Test Scripts:** Available in the same `/scripts` folder

---

**Happy Testing! 🚀**

This Postman collection provides comprehensive coverage of your Twilio webhook system with realistic data and scenarios.

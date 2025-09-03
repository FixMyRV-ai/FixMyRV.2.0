# FixMyRV - AI-Powered RV Assistant

**German Clock Precision Development Environment** ⏰  
**Production Status**: ✅ **FULLY OPERATIONAL** (September 2025)

Full-stack application providing intelligent RV troubleshooting, maintenance guidance, SMS communication, and organization management through advanced AI integration.

## 🎉 **Latest Production Updates - September 2025**

### **✅ Complete Deployment Resolution**
- **TypeScript Build Issues**: Fixed decorator configurations and ES module compatibility
- **Database Connection**: Implemented Railway-specific connection handling with retry logic
- **Error Handling**: Enhanced logging and debugging for production troubleshooting
- **API Stability**: Resolved void function return type issues in controllers

### **✅ SMS System Integration Complete**
- **Organizations Management**: Full CRUD operations for RV service organizations
- **User Management**: Organization-based user system with role management  
- **SMS Communication**: Two-way SMS conversations via Twilio integration
- **Admin Interface**: Complete admin dashboard for managing organizations and SMS
- **Database Auto-Setup**: Automatic table creation and default data insertion

### **✅ Production Deployment Features**
- **Railway Integration**: Full support for Railway's DATABASE_URL and environment variables
- **Connection Resilience**: 3-attempt retry logic with 5-second delays for database connections
- **Comprehensive Logging**: Detailed connection status and error reporting
- **Automatic Recovery**: Fallback table creation when Sequelize sync fails

### **✅ Current Production Environment**
- **URL**: `https://fixmyrv-v2.up.railway.app`
- **Platform**: Railway (PostgreSQL + Node.js)
- **Status**: All systems operational with enhanced error handling
- **Features**: AI Chat, Document Management, SMS System, Organization Management

## 🚀 One-Command Setup

```powershell
# Navigate to scripts and run intelligent start
cd scripts
.\intelligent-start.ps1
```

**Everything auto-configures!** No manual setup required.

## 🏗️ Architecture

### **Frontend (React + Vite + TypeScript)**
- **Port**: 5173
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + Radix UI
- **Features**: Real-time AI chat, document upload, payment processing

### **Backend (Node.js + Express + TypeScript)**
- **Port**: 3000  
- **Database**: PostgreSQL with pgvector extension
- **AI**: OpenAI GPT-4 + embeddings for intelligent responses
- **Features**: Vector search, document processing, SMS integration

### **Services (Docker)**
- **PostgreSQL**: pgvector/pgvector:pg15 (Port: 5433)
- **Mailcatcher**: Development email testing (Port: 1081)

## 💡 Key Features

### **AI-Powered Chat**
- GPT-4 integration for intelligent RV troubleshooting
- Vector-based document search and retrieval
- Contextual responses based on uploaded manuals

### **Document Management**
- PDF upload and processing with text extraction
- Web scraping for external RV resources
- Google Drive integration for manual storage

### **Payment Integration**
- Stripe integration for subscription plans
- Transaction management and reporting
- Graceful fallback when payment not configured

### **SMS & Organization Management**
- **Organization System**: Multi-tenant organization structure
- **User Management**: Role-based access control within organizations
- **SMS Communication**: Two-way SMS via Twilio integration
- **Admin Dashboard**: Complete management interface for organizations and SMS conversations
- **Real-time Messaging**: SMS conversations with context and history

### **Production Database & Deployment**
- **Development**: PostgreSQL with Docker (pgvector extension)
- **Production**: Railway managed PostgreSQL with automatic deployments
- **Schema**: Fully synchronized between environments with auto-creation fallbacks
- **Features**: Vector search, SMS logs, organization data, user management
- **Resilience**: Connection retry logic, automatic table creation, comprehensive error handling

## 🔧 **Recent Technical Improvements (September 2025)**

### **Deployment & Build System**
- **TypeScript Configuration**: Fixed decorator support with `useDefineForClassFields: false`
- **ES Module Compatibility**: All imports updated with `.js` extensions for production
- **Build Process**: Resolved all compilation errors for successful Railway deployment
- **Module Resolution**: Enhanced support for ES modules with proper synthetic default imports

### **Database Connection Resilience** 
- **Railway Integration**: Full support for `DATABASE_URL` connection strings
- **Retry Logic**: 3-attempt connection retry with exponential backoff
- **Error Handling**: Comprehensive connection error reporting and debugging
- **Fallback Systems**: Manual table creation when Sequelize sync fails
- **Environment Detection**: Automatic detection of Railway vs local development

### **Production Error Handling**
- **Void Function Fixes**: Resolved TypeScript return type issues in controllers
- **Enhanced Logging**: Detailed database connection status and error reporting  
- **Graceful Degradation**: SMS system continues working even with partial database issues
- **Debug Information**: Comprehensive error context for production troubleshooting

### **API & Controller Improvements**
- **Admin Chat Controller**: Enhanced SMS conversation handling with detailed error reporting
- **Database Initialization**: Automatic creation of organizations, users, chats, and messages tables
- **Default Data**: Automatic insertion of default organization and admin user
- **Connection Monitoring**: Real-time database status reporting during startup

### **Communication**
- Twilio SMS integration for notifications
- Email system with development testing
- Real-time webhook processing

## 📁 Project Structure

```
WebApp/
├── scripts/
│   ├── intelligent-start.ps1    # German clock precision startup
│   ├── intelligent-stop.ps1     # Graceful shutdown
│   └── [other utilities]
├── backend/
│   ├── controllers/             # API endpoints
│   ├── models/                  # Database models
│   ├── routes/                  # Route definitions  
│   ├── services/                # Business logic
│   ├── config/                  # Configuration files
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/                     # React application
│   ├── public/                  # Static assets
│   └── package.json             # Frontend dependencies
└── docker-compose.yml           # Local services
```

## 🎯 Quick Commands

```powershell
# Start everything (recommended)
.\intelligent-start.ps1

# Stop gracefully
.\intelligent-stop.ps1

# Force cleanup
.\intelligent-stop.ps1 -Force

# Skip dependencies (faster restart)
.\intelligent-start.ps1 -SkipDependencies
```

## 🔐 Configuration

### **Required Environment Variables**
```bash
# OpenAI (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Database (Auto-configured for local)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=fixmyrv

# Optional Integrations
STRIPE_SECRET_KEY=your-stripe-key
TWILIO_ACCOUNT_SID=your-twilio-sid
```

### **Development URLs**
- **Application**: http://localhost:5173
- **API**: http://localhost:3000
- **Database**: localhost:5433
- **Email Testing**: http://localhost:1081

## 🚀 Deployment

### **Railway Cloud (Automatic)**
1. Push to main branch
2. Railway auto-builds and deploys
3. Environment variables managed in Railway dashboard
4. Production URLs automatically configured

### **Local to Railway Setup**
- Environment detection automatically handles configuration
- Local uses Docker services (port 5433)
- Railway uses managed PostgreSQL
- No manual intervention required

## 🎪 Smart Features

### **German Clock Precision**
- ✅ **Zero-configuration startup**
- ✅ **Automatic dependency management**
- ✅ **Environment detection and adaptation**
- ✅ **Health monitoring and validation**
- ✅ **Graceful error handling and recovery**
- ✅ **Desktop shortcuts and convenience tools**

The intelligent scripts ensure that reopening the project never requires re-iteration of setup steps. Everything "just works" like a German clock! ⏰

## 🛠️ Development Notes

### **Railway Compatibility**
- Backend builds with `tsc` for Railway deployment
- Frontend builds with `npm run build`
- Environment variables automatically switch based on context
- Database migrations handle both local and cloud PostgreSQL

### **Troubleshooting**
- All services health-checked before startup completion
- Detailed logging for debugging issues
- Graceful fallbacks for missing optional services
- Desktop shortcuts for quick access

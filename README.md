# FixMyRV - AI-Powered RV Assistant

> **Full-stack AI application** providing intelligent RV troubleshooting, maintenance guidance, SMS communication, and organization management.

**Production URL**: [https://fixmyrv-v2.up.railway.app](https://fixmyrv-v2.up.railway.app)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Environment Variables](#-environment-variables)
- [Key Features](#-key-features)
- [Development](#-development)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: ≥18.0.0
- **npm**: ≥8.0.0
- **Docker**: For local PostgreSQL database
- **PowerShell**: For Windows development scripts

### One-Command Setup

```powershell
# Navigate to scripts directory
cd scripts

# Run intelligent start script
.\intelligent-start.ps1
```

**What this does:**

- ✅ Starts Docker services (PostgreSQL + Mailcatcher)
- ✅ Installs all dependencies
- ✅ Initializes database with pgvector extension
- ✅ Starts backend API server (port 3000)
- ✅ Starts frontend dev server (port 5173)
- ✅ Validates all services are healthy

### Manual Setup

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Install backend dependencies
cd backend
npm install

# 3. Create backend .env file (see Environment Variables section)
cp env.template .env  # Edit with your values

# 4. Start backend server
npm run dev

# 5. In a new terminal, start frontend
cd frontend
npm install
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5433 (PostgreSQL)
- **Email Testing**: http://localhost:1081 (Mailcatcher)

### Create Admin User

**Option 1: Automatic (Recommended)**
Just register with email `admin@gmail.com` - it's **automatically promoted** to admin with full privileges!

**Option 2: Manual Seeding**

```bash
cd backend
tsx seed-database.ts
# Creates: admin@fixmyrv.com / admin123
```

**Option 3: SQL Script**

```bash
psql -h localhost -p 5433 -U postgres -d fixmyrv -f backend/seed-admin.sql
```

---

## 🏗️ Architecture

### Frontend

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Redux Toolkit
- **Port**: 5173 (dev), configurable (prod)

### Backend

- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 with pgvector extension
- **ORM**: Sequelize
- **AI**: OpenAI GPT-4 + LangChain
- **Port**: 3000

### Database

- **Engine**: PostgreSQL 15
- **Extensions**: pgvector (for vector embeddings)
- **Local**: Docker container (port 5433)
- **Production**: Railway managed PostgreSQL

---

## 🔐 Environment Variables

### Backend Required Variables

Create a `.env` file in the `backend/` directory:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
# Railway provides DATABASE_URL automatically - that's all you need!
DATABASE_URL=postgresql://user:password@host:port/database

# For local development with Docker, use individual vars:
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fixmyrv

# ============================================
# AUTHENTICATION (REQUIRED)
# ============================================
# JWT Secret for user authentication
# Generate: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ============================================
# OPENAI (REQUIRED)
# ============================================
# OpenAI API Key for AI chat features
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# ============================================
# STRIPE PAYMENT (OPTIONAL)
# ============================================
# If not provided, payment features will be gracefully disabled
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Web URL for payment redirects and email links
WEB_URL=http://localhost:5173

# ============================================
# TWILIO SMS (OPTIONAL)
# ============================================
# Twilio credentials configured via admin panel (stored in database)
# Only needed for local testing without real webhooks:
SKIP_TWILIO_SIGNATURE=true

# ============================================
# EMAIL (OPTIONAL)
# ============================================
# Postmark API token for sending emails
# Get your token: https://postmarkapp.com
POSTMARK_TOKEN=your-postmark-server-token
EMAIL_FROM=noreply@fixmyrv.com

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=development      # 'development' or 'production'
```

### Frontend Configuration

**No `.env` file needed!** The frontend automatically detects the environment:

- **Development** (when running `npm run dev`): Uses `http://localhost:3000`
- **Production** (when built): Uses `https://fixmyrvai-api-dev.up.railway.app`

To change backend URLs, edit `frontend/src/config/helpers.tsx`:

```typescript
static localhost: string = "http://localhost:3000";
static server: string = "https://your-production-api-url.com";
```

### Environment Variable Quick Reference

| Variable                | Required      | Description                                    | Default               |
| ----------------------- | ------------- | ---------------------------------------------- | --------------------- |
| `JWT_SECRET`            | ✅ Yes        | JWT authentication secret                      | -                     |
| `OPENAI_API_KEY`        | ✅ Yes        | OpenAI API key for AI features                 | -                     |
| `DATABASE_URL`          | ✅ Production | Full PostgreSQL connection string (Railway)    | -                     |
| `DB_HOST`               | ✅ Local      | Database host (if not using DATABASE_URL)      | localhost             |
| `DB_PORT`               | ✅ Local      | Database port (if not using DATABASE_URL)      | 5433                  |
| `DB_USER`               | ✅ Local      | Database user (if not using DATABASE_URL)      | postgres              |
| `DB_PASSWORD`           | ✅ Local      | Database password (if not using DATABASE_URL)  | postgres              |
| `DB_NAME`               | ✅ Local      | Database name (if not using DATABASE_URL)      | fixmyrv               |
| `STRIPE_SECRET_KEY`     | ❌ Optional   | Stripe API key for payments                    | -                     |
| `STRIPE_WEBHOOK_SECRET` | ❌ Optional   | Stripe webhook signature secret                | -                     |
| `WEB_URL`               | ❌ Optional   | Web URL for payment redirects and emails       | http://localhost:5173 |
| `SKIP_TWILIO_SIGNATURE` | ❌ Optional   | Skip Twilio webhook signature validation (dev) | false                 |
| `POSTMARK_TOKEN`        | ❌ Optional   | Postmark API token for sending emails          | -                     |
| `EMAIL_FROM`            | ❌ Optional   | From email address                             | noreply@fixmyrv.com   |
| `PORT`                  | ❌ Optional   | Backend server port                            | 3000                  |
| `NODE_ENV`              | ❌ Optional   | Environment mode (development/production)      | development           |

### Generating JWT Secret

```bash
openssl rand -base64 32
```

---

## 💡 Key Features

### 🤖 AI-Powered Chat

- GPT-4 integration for intelligent RV troubleshooting
- Vector-based document search using pgvector
- Contextual responses based on uploaded manuals and documents
- Real-time streaming responses

### 📄 Document Management

- PDF upload and automatic text extraction
- Web scraping for external RV resources
- Google Drive integration for manual storage
- Vector embeddings for semantic search

### 💳 Payment Integration

- Stripe subscription and one-time payment support
- Transaction management and reporting
- Graceful fallback when payment is not configured
- Customer portal for subscription management

### 📱 SMS & Organization Management

- Multi-tenant organization structure
- Two-way SMS conversations via Twilio
- Role-based access control within organizations
- Admin dashboard for managing SMS conversations
- Real-time messaging with chat history

### 🗄️ Production-Ready Database

- PostgreSQL with pgvector extension for AI embeddings
- Automatic table creation and migrations
- Connection retry logic with exponential backoff
- Synchronized schemas between dev and production
- Comprehensive error handling and logging

---

## 🛠️ Development

### Development Commands

```powershell
# Start everything (recommended)
cd scripts
.\intelligent-start.ps1

# Stop gracefully
.\intelligent-stop.ps1

# Force cleanup and stop
.\intelligent-stop.ps1 -Force

# Skip dependency installation (faster restart)
.\intelligent-start.ps1 -SkipDependencies
```

### Manual Development Commands

```bash
# Backend
cd backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Start production build

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Docker Services
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose down -v        # Stop and remove volumes
```

### Database Management

```bash
# Access PostgreSQL CLI
docker exec -it fixmyrv-postgres psql -U postgres -d fixmyrv

# View tables
\dt

# Check pgvector extension
\dx

# Seed admin user and settings
cd backend
tsx seed-database.ts
```

### Admin Panel Access

After creating an admin user, login and access:

- **User Management**: Manage registered users
- **Organization Management**: Create and manage RV service organizations
- **SMS Conversations**: View and manage two-way SMS chats
- **Twilio Configuration**: Set Account SID, Auth Token, and Phone Number
- **System Settings**: Configure OpenAI and other integrations

### Testing SMS Webhooks

```bash
# Use the test endpoint (no signature validation)
POST http://localhost:3000/api/v1/twilio/test/sms
Content-Type: application/json

{
  "from": "+1234567890",
  "to": "+1987654321",
  "body": "Test message"
}
```

---

## 🚀 Deployment

### Railway (Recommended)

The application is configured for automatic Railway deployment.

**Backend Setup:**

1. Create new Railway project
2. Add PostgreSQL service
3. Add Node.js service (backend)
4. Set environment variables in Railway dashboard (see Environment Variables section)
5. Configure build command: `npm run build`
6. Configure start command: `npm start`
7. Railway automatically detects `DATABASE_URL` from PostgreSQL service

**Frontend Setup (if deploying separately):**

1. Add another Node.js service (frontend)
2. Configure build command: `npm run build`
3. Configure start command: `npm start`
4. Update `frontend/src/config/helpers.tsx` with backend URL

**Required Railway Environment Variables:**

```bash
# Railway auto-provides DATABASE_URL - you just need these:
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
NODE_ENV=production

# Optional: Stripe (if using payments)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
WEB_URL=https://your-frontend-url.com

# Optional: Email (Postmark)
POSTMARK_TOKEN=your-postmark-token
EMAIL_FROM=support@fixmyrv.com
```

That's it! Railway handles database config automatically.

### Manual Deployment

```bash
# Build backend
cd backend
npm install --production
npm run build

# Build frontend
cd frontend
npm install --production
npm run build

# Start backend (requires PostgreSQL connection)
cd backend
npm start
```

---

## 📁 Project Structure

```
FixMyRV.2.0/
├── backend/                      # Backend API server
│   ├── config/                   # Database and configuration
│   │   ├── database.ts          # Sequelize database setup
│   │   ├── initDatabase.ts      # Database initialization with retry logic
│   │   └── sync.ts              # Database synchronization
│   ├── controllers/             # API endpoint controllers
│   │   ├── auth.controller.ts   # Authentication endpoints
│   │   ├── chat.controller.ts   # Chat management
│   │   ├── openai.controller.ts # AI chat processing
│   │   ├── twilio.controller.ts # SMS webhook handling
│   │   ├── stripe.controller.ts # Payment processing
│   │   └── ...
│   ├── models/                  # Database models (Sequelize)
│   │   ├── user.ts
│   │   ├── chat.ts
│   │   ├── message.ts
│   │   ├── organization.ts
│   │   └── ...
│   ├── routes/                  # Express route definitions
│   ├── services/                # Business logic services
│   │   ├── email.service.ts
│   │   ├── sms-chat.service.ts
│   │   └── ...
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   └── upload.middleware.ts # File upload handling
│   ├── utils/                   # Utility functions
│   ├── migrations/              # SQL migration files
│   ├── .env                     # Environment variables (create this)
│   ├── package.json
│   ├── tsconfig.json
│   └── server.ts               # Application entry point
│
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── config/             # Configuration
│   │   │   └── helpers.tsx     # API endpoints & utilities
│   │   ├── store/              # Redux store
│   │   ├── hooks/              # Custom React hooks
│   │   └── App.tsx             # Root component
│   ├── public/                 # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── scripts/                     # PowerShell automation scripts
│   ├── intelligent-start.ps1   # One-command startup
│   ├── intelligent-stop.ps1    # Graceful shutdown
│   └── ...
│
├── docker-compose.yml          # Local development services
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 🔧 Troubleshooting

### Common Issues

**Database connection fails:**

```bash
# Check if PostgreSQL is running
docker ps

# Restart Docker services
docker-compose down
docker-compose up -d

# Check logs
docker logs fixmyrv-postgres
```

**Frontend can't connect to backend:**

- Verify backend is running on port 3000
- Check `frontend/src/config/helpers.tsx` for correct API URL
- Check for CORS errors in browser console

**OpenAI API errors:**

- Verify `OPENAI_API_KEY` is set correctly in backend `.env`
- Check OpenAI account has sufficient credits
- Check OpenAI API status: https://status.openai.com

**Twilio webhook not working:**

- For local testing, set `SKIP_TWILIO_SIGNATURE=true`
- For production, ensure webhook URL is `https://your-domain.com/api/v1/twilio/webhook/sms`
- Configure Twilio credentials in admin panel
- Check webhook logs: `GET /api/v1/twilio/logs`

**Payment/Stripe issues:**

- Stripe features are optional - app works without them
- Set `STRIPE_SECRET_KEY` only if using payment features
- Check webhook endpoint matches Stripe dashboard configuration

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For issues and questions:

- Open a GitHub issue
- Check PowerShell scripts in `/scripts/` for automation tools
- Review code comments for implementation details

---

**Built with ❤️ for the RV community**

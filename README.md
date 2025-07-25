# FixMyRV WebApp

This directory contains the full-stack FixMyRV application with proper isolation between frontend and backend.

## Structure

```
WebApp/
├── backend/          # Node.js/Express API server
└── frontend/         # React/Vite client application
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL with pgvector extension (for backend database)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
**Runs on**: http://localhost:5173 (or next available port)

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```
**Runs on**: http://localhost:5174 (or next available port)

## Important Notes

- Each directory (backend/frontend) is **completely self-contained**
- Each has its own `package.json`, `node_modules`, and dependencies
- **Never install packages in the parent WebApp directory**
- Always run commands from within the specific backend or frontend directory

## Development Workflow

1. Start backend server: `cd backend && npm run dev`
2. Start frontend server: `cd frontend && npm run dev`
3. Access application at frontend URL (typically http://localhost:5174)

## Environment Configuration

- Backend requires `.env` file with database credentials and API keys
- Frontend automatically connects to backend API
- See individual directory README files for detailed setup instructions

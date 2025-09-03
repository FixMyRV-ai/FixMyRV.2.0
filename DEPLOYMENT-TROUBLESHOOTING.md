# FixMyRV Deployment Troubleshooting Guide

**Last Updated**: September 3, 2025  
**Target Environment**: Railway Production Deployment

## 🚨 Common Deployment Issues & Solutions

### 1. TypeScript Build Failures

#### **Issue**: Decorator compilation errors
```
error TS1240: Unable to resolve signature of property decorator when called as an expression
```

#### **Solution**: Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,  // Critical fix
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler"
  }
}
```

#### **Status**: ✅ **RESOLVED** - All TypeScript compilation errors fixed

---

### 2. Database Connection Issues

#### **Issue**: `ECONNREFUSED` errors in production
```
ConnectionRefusedError [SequelizeConnectionRefusedError]
code: 'ECONNREFUSED'
```

#### **Solution**: Railway-specific connection handling
```typescript
// models/index.ts - Enhanced connection logic
const databaseUrl = process.env.DATABASE_URL;
let sequelize: Sequelize;

if (databaseUrl) {
  console.log("🚄 Railway DATABASE_URL detected");
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    retry: { max: 3 }
  });
} else {
  // Fallback to individual environment variables
  sequelize = new Sequelize(/* ... individual config ... */);
}
```

#### **Connection Retry Logic**:
```typescript
let retries = 3;
while (retries > 0) {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    console.log(`⏳ Waiting 5 seconds before retry...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

#### **Status**: ✅ **RESOLVED** - Comprehensive connection handling implemented

---

### 3. ES Module Import Issues

#### **Issue**: Module resolution failures in production
```
error TS2306: File 'config/initDatabase.ts' is not a module
```

#### **Solution**: Update all imports to use `.js` extensions
```typescript
// Before
import initDatabase from "./config/initDatabase";

// After  
import { initDatabase } from "./config/initDatabase.js";
```

#### **__dirname Compatibility**:
```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

#### **Status**: ✅ **RESOLVED** - All imports updated for ES module compatibility

---

### 4. Void Function Return Type Errors

#### **Issue**: Controller function return type conflicts
```
error TS2322: Type 'Response<any, Record<string, any>>' is not assignable to type 'void'
```

#### **Solution**: Use void keyword for response calls
```typescript
// Before
return res.status(500).json({ error: "Database error" });

// After
void res.status(500).json({ error: "Database error" });
return;
```

#### **Status**: ✅ **RESOLVED** - All controller functions properly typed

---

### 5. Missing Database Tables in Production

#### **Issue**: Organization tables don't exist in production database
```
relation "organizations" does not exist
```

#### **Solution**: Automatic table creation with fallbacks
```typescript
try {
  // Try Sequelize sync first
  await sequelize.sync({ force: false, alter: true });
} catch (syncError) {
  // Manual table creation as fallback
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  // ... additional tables
}
```

#### **Status**: ✅ **RESOLVED** - Comprehensive database initialization implemented

---

## 🔧 Deployment Checklist

### Pre-Deployment
- [ ] TypeScript builds successfully locally (`npm run build`)
- [ ] All imports use `.js` extensions for ES modules
- [ ] Environment variables configured in Railway dashboard
- [ ] Database service connected to application in Railway
- [ ] `tsconfig.json` has correct decorator configuration

### Post-Deployment Monitoring
- [ ] Check Railway deployment logs for errors
- [ ] Verify database connection in startup logs
- [ ] Test API endpoints for 200 responses
- [ ] Confirm SMS conversations load without errors
- [ ] Monitor error rates in production

### Environment Variables Required
```bash
# Database (Railway managed)
DATABASE_URL=postgresql://... (automatically set by Railway)

# Or individual variables
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...

# Optional: Force database sync
FORCE_DB_SYNC=true
```

## 🚀 Successful Deployment Indicators

### Railway Logs Should Show:
```
🔍 Database connection info:
- DB_HOST: containers-us-west-xxx.railway.app
- DB_PORT: 5432
- NODE_ENV: production

🚄 Railway DATABASE_URL detected, using connection string
🔌 Attempting database connection... (1/3)
✅ Database connection successful!
🔄 Starting model synchronization...
✅ Database models synchronized successfully.
📊 Found 1 organizations in database.
🎉 Database initialization completed successfully!

Server is running on port 3000
🌐 Server URL: https://fixmyrv-v2.up.railway.app
```

### Health Check Endpoints:
- `GET /api/v1/health` - Should return 200 OK
- `GET /api/v1/admin/organizations` - Should return organization data (with auth)
- `GET /api/v1/admin/sms-chats` - Should return SMS conversations (with auth)

## 📞 Support

If deployment issues persist:
1. Check Railway deployment logs
2. Verify environment variables in Railway dashboard
3. Test database connection manually
4. Review this troubleshooting guide
5. Check GitHub commit history for recent changes

**Current Status**: All major deployment issues resolved as of September 3, 2025

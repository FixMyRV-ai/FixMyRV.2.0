import { createServer } from "http";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import app from "./app.js";
import sync from "./config/sync.js";
import sequelize, { Organization, OrganizationUser } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database initialization function
async function initDatabase(): Promise<void> {
  console.log("🗃️  Starting database initialization...");
  
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`🔌 Attempting database connection... (${4 - retries}/3)`);
      
      // Test the connection first
      await sequelize.authenticate();
      console.log("✅ Database connection successful!");
      break;
      
    } catch (error: any) {
      console.error(`❌ Database connection failed (attempt ${4 - retries}/3):`, error.message);
      retries--;
      
      if (retries === 0) {
        console.error("💥 All connection attempts failed. Database may not be ready.");
        console.error("🔍 Connection details:");
        console.error("- Error code:", error.original?.code || "unknown");
        console.error("- Error message:", error.message);
        throw new Error(`Database connection failed after 3 attempts: ${error.message}`);
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  try {
    console.log("🔄 Starting model synchronization...");
    
    // Check if we should force database sync (useful for production setup)
    const forceSync = process.env.FORCE_DB_SYNC === 'true';
    console.log(`📊 FORCE_DB_SYNC setting: ${forceSync}`);
    
    // Force sync models to create missing tables
    await sequelize.sync({ 
      force: forceSync, 
      alter: !forceSync, // Only alter if not forcing
      logging: console.log 
    });
    console.log("✅ Database models synchronized successfully.");
    
    // Check if organizations table exists and has data
    const orgCount = await Organization.count();
    console.log(`📊 Found ${orgCount} organizations in database.`);
    
    // Create default organization if none exists
    if (orgCount === 0) {
      console.log("🏢 Creating default organization...");
      
      const defaultOrg = await Organization.create({
        name: "Default Organization"
      });
      
      console.log(`✅ Created default organization with ID: ${defaultOrg.id}`);
      
      // Create default admin user for the organization
      const defaultOrgUser = await OrganizationUser.create({
        organizationId: defaultOrg.id,
        firstName: "Admin",
        lastName: "User", 
        email: "admin@fixmyrv.com",
        password: "admin123",
        role: "admin",
        verified: true,
        phone: "+1234567890",
        status: "active"
      });
      
      console.log(`✅ Created default admin user with ID: ${defaultOrgUser.id}`);
    }
    
    console.log("🎉 Database initialization completed successfully!");
    
  } catch (syncError: any) {
    console.error("❌ Database sync failed, trying manual table creation...");
    console.error("Sync error:", syncError.message);
    
    try {
      // Manual table creation as fallback
      console.log("🛠️  Attempting manual table creation...");
      
      // Create organizations table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Organizations table created/verified");
      
      // Create organization_users table  
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS organization_users (
          id SERIAL PRIMARY KEY,
          "organizationId" INTEGER REFERENCES organizations(id),
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          verified BOOLEAN DEFAULT false,
          phone VARCHAR(20) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Organization users table created/verified");
      
      // Create chats table for SMS conversations
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          channel VARCHAR(50) NOT NULL DEFAULT 'sms',
          "organizationId" INTEGER REFERENCES organizations(id),
          "customerPhone" VARCHAR(20) NOT NULL,
          "customerName" VARCHAR(255),
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Chats table created/verified");
      
      // Create messages table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          "chatId" INTEGER REFERENCES chats(id),
          content TEXT NOT NULL,
          "senderType" VARCHAR(50) NOT NULL,
          "senderName" VARCHAR(255),
          "messageType" VARCHAR(50) DEFAULT 'text',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Messages table created/verified");
      
      // Create users table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(50) DEFAULT 'user',
          verified BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Users table created/verified");
      
      // Create twilio_settings table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS twilio_settings (
          id SERIAL PRIMARY KEY,
          "organizationId" INTEGER REFERENCES organizations(id),
          "accountSid" VARCHAR(255) NOT NULL,
          "authToken" VARCHAR(255) NOT NULL,
          "phoneNumber" VARCHAR(20) NOT NULL,
          "webhookUrl" VARCHAR(500),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Twilio settings table created/verified");
      
      console.log("🎉 Manual database setup completed successfully!");
      
    } catch (manualError: any) {
      console.error("💥 Manual table creation also failed:", manualError.message);
      throw manualError;
    }
  }
}

import dotenv from "dotenv";

dotenv.config();

const server = createServer(app);

// Initialize WebSocket server

const PORT = process.env.PORT || 3000; // Fallback to port 3000 if not specified

// Sync database and then start the server
const startServer = async () => {
  try {
    console.log("🚀 Starting FixMyRV server...");
    console.log("🔧 Enhanced database initialization - September 3, 2025");
    
    // Initialize database with comprehensive setup
    await initDatabase();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🎉 Server running successfully on port ${PORT}`);
      console.log(`🌐 Production URL: https://fixmyrv-v2.up.railway.app`);
      console.log(`📱 SMS Features: Organization management and conversations should now be working!`);
    });
    
  } catch (error) {
    console.error("❌ Error starting the server:", error);
    process.exit(1); // Exit with error code to trigger restart in production
  }
};

startServer();

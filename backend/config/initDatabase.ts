import sequelize, { Organization, OrganizationUser } from "../models/index.js";

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
    
    // Force sync models to create missing tables
    await sequelize.sync({ force: false, alter: true, logging: console.log });
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
      
      // Create chats table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          "userId" VARCHAR(255),
          title VARCHAR(255),
          channel VARCHAR(10) DEFAULT 'web',
          "organizationUserId" INTEGER REFERENCES organization_users(id),
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
          is_bot BOOLEAN DEFAULT false,
          "smsMessageSid" VARCHAR(255),
          "smsBatchIndex" INTEGER,
          "smsBatchTotal" INTEGER,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("✅ Messages table created/verified");
      
      // Insert default data
      await sequelize.query(`
        INSERT INTO organizations (name) 
        SELECT 'Default Organization' 
        WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);
      `);
      
      await sequelize.query(`
        INSERT INTO organization_users (
          "organizationId", "firstName", "lastName", email, password, 
          role, verified, phone, status
        )
        SELECT 1, 'Admin', 'User', 'admin@fixmyrv.com', 'admin123',
               'admin', true, '+1234567890', 'active'
        WHERE NOT EXISTS (SELECT 1 FROM organization_users LIMIT 1);
      `);
      
      console.log("🎉 Manual database setup completed successfully!");
      
    } catch (manualError: any) {
      console.error("💥 Manual table creation also failed:", manualError.message);
      throw manualError;
    }
  }
}

// Named export
export { initDatabase };

// Default export  
export default initDatabase;

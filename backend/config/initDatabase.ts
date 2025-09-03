import sequelize, { Organization, OrganizationUser } from "../models/index.js";

const initializeDatabase = async () => {
  try {
    console.log("🔧 Starting database initialization...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Force sync models to create missing tables
    await sequelize.sync({ force: false, alter: true, logging: console.log });
    console.log("✅ Database models synchronized successfully.");
    
    // Check if organizations table exists and has data
    const orgCount = await Organization.count();
    console.log(`📊 Found ${orgCount} organizations in database.`);
    
    // Create default organization if none exists
    if (orgCount === 0) {
      const defaultOrg = await Organization.create({
        name: "FixMyRV Default Organization"
      });
      console.log("✅ Created default organization:", defaultOrg.toJSON());
    }
    
    // Check organization users
    const userCount = await OrganizationUser.count();
    console.log(`👥 Found ${userCount} organization users in database.`);
    
    // Create a test organization user if none exists
    if (userCount === 0) {
      const firstOrg = await Organization.findOne();
      if (firstOrg) {
        const testUser = await OrganizationUser.create({
          organizationId: firstOrg.id,
          firstName: "Test",
          lastName: "User",
          email: "test@fixmyrv.com",
          password: "password123",
          phone: "+15551234567",
          role: "user",
          status: "active",
          verified: true
        });
        console.log("✅ Created test organization user:", {
          id: testUser.id,
          name: testUser.fullName,
          email: testUser.email,
          phone: testUser.phone
        });
      }
    }
    
    console.log("🎉 Database initialization completed successfully!");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    
    // Try to create tables manually if sync fails
    try {
      console.log("🔄 Attempting manual table creation...");
      
      // Create organizations table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "organizations" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create organization_users table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "organization_users" (
          "id" SERIAL PRIMARY KEY,
          "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          "email" VARCHAR(255) NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "role" VARCHAR(10) NOT NULL DEFAULT 'user' CHECK ("role" IN ('user', 'admin', 'manager')),
          "verified" BOOLEAN NOT NULL DEFAULT FALSE,
          "phone" VARCHAR(20) NOT NULL,
          "status" VARCHAR(15) NOT NULL DEFAULT 'new_user' CHECK ("status" IN ('active', 'inactive', 'suspended', 'new_user', 'invited')),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE("organizationId", "email")
        );
      `);
      
      console.log("✅ Manual table creation completed.");
      
    } catch (manualError) {
      console.error("❌ Manual table creation also failed:", manualError);
      throw error; // Re-throw original error
    }
  }
};

export default initializeDatabase;

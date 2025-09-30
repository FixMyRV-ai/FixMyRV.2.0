import bcrypt from "bcrypt";
import sequelize, { User, TwilioSetting } from "./models/index.js";

/**
 * Seed Database with Admin User and Twilio Settings
 *
 * Usage: tsx backend/seed-database.ts
 */

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync tables
    await sequelize.sync();
    console.log("✅ Tables synchronized");

    // 1. Seed Admin User
    console.log("\n👤 Seeding admin user...");

    const adminEmail = "admin@fixmyrv.com";
    const adminPassword = "admin123";

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${adminEmail}`);
      console.log("   Updating to ensure admin privileges...");

      await existingAdmin.update({
        role: "admin",
        verified: true,
        type: "pro",
        plan_type: "subscription",
        credits: 1000,
      });

      console.log(`✅ Admin user updated: ${adminEmail}`);
    } else {
      const adminUser = await User.create({
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        password: adminPassword, // Will be hashed by beforeSave hook
        role: "admin",
        verified: true,
        type: "pro",
        plan_type: "subscription",
        credits: 1000,
      });

      console.log(`✅ Admin user created: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }

    // 2. Seed Twilio Settings (empty placeholder)
    console.log("\n📱 Setting up Twilio settings table...");

    const existingTwilio = await TwilioSetting.findOne();

    if (existingTwilio) {
      console.log("⚠️  Twilio settings already exist");
      console.log("   Configure via admin panel or update manually");
    } else {
      await TwilioSetting.create({
        accountSid: null,
        authToken: null,
        phoneNumber: null,
        optinMessage:
          'Your Phone Number has been associated with a FixMyRV.ai service account. To confirm and Opt-In, please respond "YES" to this message. At any moment you can stop all messages from us, by texting back "STOP".',
      });

      console.log("✅ Twilio settings table initialized");
      console.log("   Configure credentials via admin panel");
    }

    // Summary
    console.log("\n🎉 Database seeding completed!");
    console.log("\n📋 Summary:");
    console.log(`   • Admin Email: ${adminEmail}`);
    console.log(`   • Admin Password: ${adminPassword}`);
    console.log(`   • Admin Role: admin`);
    console.log(`   • Twilio: Configure in admin panel`);
    console.log("\n🚀 Next steps:");
    console.log("   1. Start the backend: npm run dev");
    console.log("   2. Login with admin credentials");
    console.log("   3. Navigate to admin panel");
    console.log(
      "   4. Configure Twilio settings (Account SID, Auth Token, Phone Number)"
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run seeder
seedDatabase();

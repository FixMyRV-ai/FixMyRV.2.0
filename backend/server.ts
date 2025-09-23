import { createServer } from "http";
import app from "./app.js";
import { initDatabase } from "./config/initDatabase.js";
import dotenv from "dotenv";

dotenv.config();

const server = createServer(app);

// Initialize WebSocket server

const PORT = process.env.PORT || 3000; // Fallback to port 3000 if not specified

// Sync database and then start the server
const startServer = async () => {
  try {
    console.log("🚀 Starting FixMyRV server...");
    console.log("🔧 Using centralized DB initialization (config/initDatabase)");
    
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

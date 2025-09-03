import { createServer } from "http";
import app from "./app.js";
import sync from "./config/sync.js";
import initializeDatabase from "./config/initDatabase.js";
import sequelize from "./models/index.js"; // Import the sync function
import dotenv from "dotenv";

dotenv.config();

const server = createServer(app);

// Initialize WebSocket server

const PORT = process.env.PORT || 3000; // Fallback to port 3000 if not specified

// Sync database and then start the server
const startServer = async () => {
  try {
    console.log("🚀 Starting FixMyRV server...");
    
    // Initialize database with comprehensive setup
    await initializeDatabase();
    
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

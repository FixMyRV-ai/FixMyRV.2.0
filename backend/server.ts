import { createServer } from "http";
import app from "./app";
import sync from "./config/sync";
import sequelize from "./models/index"; // Import the sync function
import dotenv from "dotenv";

dotenv.config();

const server = createServer(app);

// Initialize WebSocket server

const PORT = process.env.PORT || 3000; // Fallback to port 3000 if not specified

// Sync database and then start the server
const startServer = async () => {
  await sequelize.authenticate();
  await sync();
  console.log("Database connected successfully.");
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Error starting the server:", error);
});

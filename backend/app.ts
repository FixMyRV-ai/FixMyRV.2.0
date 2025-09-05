import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import openaiRoutes from "./routes/openai.routes.js";
import contentRoutes from "./routes/content.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import settingRouter from "./routes/setting.routes.js";
import planRouter from "./routes/plan.routes.js";
import stripeRouter from "./routes/stripe.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import twilioRouter from "./routes/twilio.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import organizationUserRouter from "./routes/organizationUser.routes.js";
import adminSetupRouter from "./routes/admin-setup.routes.js";
import adminPromoteRouter from "./routes/admin-promote.routes.js";
import passwordUpdateRouter from "./routes/password-update.routes.js";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors()); // Enable CORS for cross-origin requests

// Debug middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Apply raw body parsing for Stripe webhook route
app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));

// Apply JSON parsing for all other routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Define routes for user and authentication management - MUST BE BEFORE STATIC FILES
app.use("/uploads", express.static("uploads"));
const v1Router = express.Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/openai", openaiRoutes);
v1Router.use("/content", contentRoutes);
v1Router.use("/chats", chatRoutes);
v1Router.use("/setting", settingRouter);
v1Router.use("/plan", planRouter);
v1Router.use("/stripe", stripeRouter);
v1Router.use("/transaction", transactionRouter);
v1Router.use("/twilio", twilioRouter);
v1Router.use("/organizations", organizationRouter);
v1Router.use("/", organizationUserRouter); // Organization user routes include full path
v1Router.use("/setup", adminSetupRouter); // Temporary admin setup route
v1Router.use("/promote", adminPromoteRouter); // One-time admin promotion route
v1Router.use("/fix", passwordUpdateRouter); // Simple password update route
app.use("/api/v1", v1Router);

app.get("/api/v1/", (req, res) => {
  res.json({ 
    Hello: "World", 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV,
    message: "Backend API is running successfully!",
    database: "Railway PostgreSQL connected"
  });
});

// REMOVED ALL FRONTEND STATIC FILE SERVING
// Railway should ONLY run the backend API server
// Frontend will be deployed separately

export default app; // Use export default instead of module.exports

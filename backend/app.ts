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
v1Router.use("/organization-users", organizationUserRouter); // Changed from "/" to "/organization-users"
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

// Environment check endpoint
app.get("/api/env-check", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    hasJWT_SECRET: !!process.env.JWT_SECRET,
    hasREFRESH_TOKEN_SECRET: !!process.env.REFRESH_TOKEN_SECRET,
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasSTRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    hasEMAIL_USER: !!process.env.EMAIL_USER,
    hasEMAIL_PASS: !!process.env.EMAIL_PASS,
    JWT_SECRET_length: process.env.JWT_SECRET?.length || 0,
    REFRESH_TOKEN_SECRET_length: process.env.REFRESH_TOKEN_SECRET?.length || 0
  });
});

// Test endpoint for debugging login
app.get("/api/test-user", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { User } = await import('./models/index.js');
    const bcrypt = await import('bcrypt');
    
    const user = await User.findOne({ where: { email: 'admin@gmail.com' } });
    
    if (!user) {
      res.json({ error: 'User not found' });
      return;
    }
    
    const testPassword = '12345678';
    const isMatch = await bcrypt.default.compare(testPassword, user.password);
    
    res.json({
      userExists: true,
      email: user.email,
      verified: user.verified,
      role: user.role,
      hasPassword: !!user.password,
      passwordMatches: isMatch,
      passwordLength: user.password?.length || 0
    });
    
  } catch (error) {
    res.json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Simple login endpoint for debugging
app.post("/api/simple-login", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { User } = await import('./models/index.js');
    const bcrypt = await import('bcrypt');
    const jwt = await import('jsonwebtoken');
    
    console.log('🔄 Simple login attempt for:', email);
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const isMatch = await bcrypt.default.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    if (!user.verified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }
    
    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: 'JWT_SECRET not configured' });
      return;
    }
    
    console.log('✅ Creating token...');
    const token = jwt.default.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        credits: user.credits,
        type: user.type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    console.log('✅ Login successful for:', email);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        verified: user.verified,
        type: user.type,
        credits: user.credits
      }
    });
    
  } catch (error) {
    console.error('❌ Simple login error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// REMOVED ALL FRONTEND STATIC FILE SERVING
// Railway should ONLY run the backend API server
// Frontend will be deployed separately

export default app; // Use export default instead of module.exports

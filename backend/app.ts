import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import openaiRoutes from "./routes/openai.routes";
import contentRoutes from "./routes/content.routes";
import chatRoutes from "./routes/chat.routes";
import settingRouter from "./routes/setting.routes";
import planRouter from "./routes/plan.routes";
import stripeRouter from "./routes/stripe.routes";
import transactionRouter from "./routes/transaction.routes";
const app = express();

app.use(cors()); // Enable CORS for cross-origin requests

// Apply raw body parsing for Stripe webhook route
app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));

// Apply JSON parsing for all other routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Define routes for user and authentication management
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
app.use("/api/v1", v1Router);

app.get("/api/v1/", (req, res) => {
  res.send({ Hello: "World" });
});

export default app; // Use export default instead of module.exports

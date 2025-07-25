import express, { RequestHandler, Router } from "express";
import StripeController from "../controllers/stripe.controller";
import authMiddleware from "../middlewares/auth.middleware";

const stripeRouter = Router();

// Webhook route
stripeRouter.post("/webhook", StripeController.handleWebhook as RequestHandler);

// Apply auth middleware to all routes
stripeRouter.use(authMiddleware);

stripeRouter.get("/plans", StripeController.getPlans as RequestHandler);

stripeRouter.post(
  "/create-checkout-session",
  StripeController.createCheckoutSession as RequestHandler
);

stripeRouter.get(
  "/checkout-session/:session_id",
  StripeController.getCheckoutSession as RequestHandler
);

stripeRouter.get(
  "/subscription",
  StripeController.getSubscription as RequestHandler
);

stripeRouter.post(
  "/cancel-subscription",
  StripeController.cancelSubscription as RequestHandler
);

export default stripeRouter;

import { Router } from "express";
import StripeController from "../controllers/stripe.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const stripeRouter = Router();
// Webhook route
stripeRouter.post("/webhook", StripeController.handleWebhook);
// Apply auth middleware to all routes
stripeRouter.use(authMiddleware);
stripeRouter.get("/plans", StripeController.getPlans);
stripeRouter.post("/create-checkout-session", StripeController.createCheckoutSession);
stripeRouter.get("/checkout-session/:session_id", StripeController.getCheckoutSession);
stripeRouter.get("/subscription", StripeController.getSubscription);
stripeRouter.post("/cancel-subscription", StripeController.cancelSubscription);
export default stripeRouter;
//# sourceMappingURL=stripe.routes.js.map
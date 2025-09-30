import Stripe from "stripe";
import { Request, Response } from "express";
import sequelize, { User } from "../models/index.js";
import { AuthenticatedRequest } from "../types/user.js";
import userController from "./user.controller";

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string)
  : null;

// Helper function to check if Stripe is configured
const isStripeConfigured = (): boolean => {
  return stripe !== null && !!process.env.STRIPE_SECRET_KEY;
};

// Helper function to handle Stripe not configured
const handleStripeNotConfigured = (res: Response) => {
  return res.status(503).json({
    error: "Payment service not configured",
    message: "Stripe is not properly configured on this server",
  });
};

class StripeController {
  static async createCheckoutSession(req: Request, res: Response) {
    if (!isStripeConfigured()) {
      return handleStripeNotConfigured(res);
    }

    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { priceId } = req.body;

    // Get user information
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let customerId = user.stripeCustomerId;

    if (customerId) {
      // Check if user already has an active subscription
      const subscriptions = await stripe!.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      if (subscriptions.data.length > 0) {
        return res.status(400).json({
          error:
            "You already have an active subscription. Please cancel your current plan before subscribing to a new one.",
        });
      }
    } else {
      // Create a new customer if one doesn't exist
      const customer = await stripe!.customers.create({
        email: user.email,
        name: user.firstName + " " + user.lastName,
      });
      customerId = customer.id;
      await user.update({ stripeCustomerId: customerId });
    }
    try {
      // Get price details
      const price = await stripe!.prices.retrieve(priceId, {
        expand: ["product"],
      });

      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }

      const product = price.product as Stripe.Product;

      const isRecurring = !!price.recurring;

      // Create checkout session
      const session = await stripe!.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: isRecurring ? "subscription" : "payment",
        success_url: `${process.env.WEB_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.WEB_URL}/upgrade`,
        customer: user.stripeCustomerId,
        metadata: {
          userId: String(userId),
          productId: product.id,
          credits: product.metadata?.credits || "0",
        },
      });

      await user.update({ sessionId: session.id });

      res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  }

  static async getPlans(req: Request, res: Response) {
    try {
      const stripePlans = await stripe!.products.list({
        active: true,
        expand: ["data.default_price"],
      });
      const plans = stripePlans.data.map((plan) => {
        const price = plan.default_price;

        let features = [];

        if (plan.metadata) {
          if (plan.metadata.features) {
            try {
              features = JSON.parse(plan.metadata.features);
            } catch (e) {
              console.error("Error parsing features:", e);
            }
          }
        }

        return {
          id: plan.id,
          priceId: price ? (price as Stripe.Price).id : null,
          name: plan.name,
          description: plan.description || "",
          unitAmount:
            price && typeof (price as Stripe.Price).unit_amount === "number"
              ? ((price as Stripe.Price).unit_amount ?? 0) / 100
              : 0,
          currency: (price as Stripe.Price)?.currency || "usd",
          recurring: !!(price as Stripe.Price)?.recurring,
          interval: (price as Stripe.Price)?.recurring?.interval || null,
          features,
          active: plan.active,
          credits: plan.metadata.credits,
          metadata: plan.metadata,
        };
      });

      res.status(200).json({
        data: plans,
      });
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  }

  static async getSubscription(req: Request, res: Response) {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const subscription = await stripe!.subscriptions.list({
        customer: user?.stripeCustomerId as string,
      });

      res.status(200).json({
        data: subscription.data[0],
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  }

  static async cancelSubscription(req: Request, res: Response) {
    try {
      const subscriptionId = req.body.subscriptionId;
      const userId = req.user?.id;
      // Get user's active subscription
      const subscription = await stripe!.subscriptions.cancel(subscriptionId);

      const user = await User.findOne({ where: { id: userId as string } });

      await user?.update({ type: "normal" });

      res.status(200).json({
        message: "Subscription cancelled successfully",
        data: subscription,
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }

  static async getCheckoutSession(req: Request, res: Response) {
    try {
      const { session_id } = req.params;

      // Retrieve the checkout session
      const session = await stripe!.checkout.sessions.retrieve(session_id, {
        expand: ["line_items", "payment_intent", "subscription"],
      });

      res.json({ data: session });
    } catch (error) {
      console.error("Error fetching checkout session:", error);
      res.status(500).json({ error: "Failed to fetch checkout session" });
    }
  }

  // handle webhook
  static async handleWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"];
    let eventObject;
    try {
      const rawBody = req.body;

      eventObject = stripe!.webhooks.constructEvent(
        rawBody,
        signature as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(400).send(`Webhook error: ${err}`);
    }

    switch (eventObject.type) {
      case "checkout.session.completed":
        await StripeController.handleCheckoutSessionCompletedWebhook(
          eventObject
        );
        break;
      case "invoice.payment_succeeded":
        await StripeController.handleInvoicePaymentSucceededWebhook(
          eventObject
        );
        break;
    }

    // Return a 200 response to acknowledge receipt of the webhook
    res.status(200).json({ received: true });
  }

  static async handleCheckoutSessionCompletedWebhook(event: Stripe.Event) {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("No userId found in session metadata");
        return;
      }

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        return;
      }

      const credits = session.metadata?.credits
        ? parseInt(session.metadata.credits)
        : undefined;

      if (credits) {
        if (!isNaN(credits) && credits > 0) {
          user.credits += credits;
          user.type = "pro";
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }

      if (session.mode === "subscription" && session.subscription) {
        user.plan_type = "subscription";
      } else if (session.mode === "payment" && session.payment_intent) {
        user.plan_type = "payment";
      }
      // Save user changes
      await user.save();

      console.log(
        `Successfully processed checkout session ${session.id} for user ${userId}`
      );
    } catch (error) {
      console.error("Error processing checkout session webhook:", error);
    }
  }

  static async handleInvoicePaymentSucceededWebhook(event: Stripe.Event) {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const user = await User.findOne({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        console.error(`User not found with Stripe customer ID: ${customerId}`);
        return;
      }
      // Get the subscription to find the product
      // @ts-ignore
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) {
        console.error("No subscription found in invoice:", invoice.id);
        return;
      }

      const subscription = await stripe!.subscriptions.retrieve(
        subscriptionId as string,
        {
          expand: ["items.data.plan.product", "customer"],
        }
      );
      const product = subscription.items.data[0].plan.product as Stripe.Product;

      if (!product) {
        console.error("Product not found in subscription:", subscriptionId);
        return;
      }

      if (user.sessionId) {
        user.sessionId = null;
        await user.save();

        console.log(
          `Successfully processed invoice payment for user ${user.get("id")}`
        );
        return;
      }

      const creditsToAdd = parseInt(product.metadata?.credits as string);
      if (!isNaN(creditsToAdd) && creditsToAdd > 0) {
        user.credits += creditsToAdd;
        console.log(`Added ${creditsToAdd} credits to user ${user.get("id")}`);
      }
      // Ensure user's plan type is set to subscription
      user.plan_type = "subscription";

      // Save user changes
      await user.save();

      console.log(
        `User ${user.get(
          "id"
        )} upgraded to pro and added ${creditsToAdd} credits after schedule completion`
      );
    } catch (error) {
      console.error(
        "Error processing invoice payment succeeded webhook:",
        error
      );
    }
  }
}
export default StripeController;

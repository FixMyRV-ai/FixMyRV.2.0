import { Request, Response } from "express";
import { User } from "../models/index";
import { Op } from "sequelize";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

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
    message: "Stripe is not properly configured on this server" 
  });
};

class TransactionController {
  // Get all transactions with pagination and filtering
  static async getAllTransactions(req: Request, res: Response) {
    if (!isStripeConfigured()) {
      return handleStripeNotConfigured(res);
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const customerId = req.query.customerId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Build Stripe query parameters
      const queryParams: Stripe.ChargeListParams = {
        limit: limit,
        starting_after: page > 1 ? ((page - 1) * limit).toString() : undefined,
      };

      // Add filters if provided
      if (status) {
        // @ts-ignore - Stripe types are not up to date
        queryParams.status = status;
      }
      if (customerId) {
        queryParams.customer = customerId;
      }
      if (startDate && endDate) {
        queryParams.created = {
          gte: Math.floor(new Date(startDate).getTime() / 1000),
          lte: Math.floor(new Date(endDate).getTime() / 1000),
        };
      }

      const charges = await stripe!.charges.list(queryParams);
      // Process transactions to include user information where customer ID exists
      const processedTransactions = await Promise.all(
        charges.data.map(async (charge) => {
          if (charge.customer) {
            const user = await User.findOne({
              where: { stripeCustomerId: charge.customer },
              attributes: ["id", "email", "firstName", "lastName"],
            });

            if (user) {
              return {
                ...charge,
                user: user.toJSON(),
              };
            }
          }
          return charge;
        })
      );

      res.json({
        data: processedTransactions,
        pagination: {
          total: charges.data.length,
          page,
          limit,
          has_more: charges.has_more,
          totalPages: Math.ceil(charges.data.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }

  // Get transaction statistics
  static async getTransactionStats(req: Request, res: Response) {
    if (!isStripeConfigured()) {
      return handleStripeNotConfigured(res);
    }

    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 100;

      // Build date filter for Stripe
      const dateFilter: Stripe.ChargeListParams = {};
      if (startDate && endDate) {
        dateFilter.created = {
          gte: Math.floor(new Date(startDate).getTime() / 1000),
          lte: Math.floor(new Date(endDate).getTime() / 1000),
        };
      }

      // Get all charges for the period
      const charges = await stripe!.charges.list({
        ...dateFilter,
        limit: limit, // Adjust based on your needs
      });

      // Calculate statistics
      const stats = {
        totalRevenue: charges.data.reduce(
          (sum, charge) => sum + (charge.amount || 0),
          0
        ),
        statusCounts: charges.data.reduce(
          (acc: Record<string, number>, charge) => {
            acc[charge.status] = (acc[charge.status] || 0) + 1;
            return acc;
          },
          {}
        ),
        currencyBreakdown: charges.data.reduce(
          (acc: Record<string, number>, charge) => {
            acc[charge.currency] =
              (acc[charge.currency] || 0) + (charge.amount || 0);
            return acc;
          },
          {}
        ),
      };

      res.json({ data: stats });
    } catch (error) {
      console.error("Error fetching transaction statistics:", error);
      res.status(500).json({ error: "Failed to fetch transaction statistics" });
    }
  }
}

export default TransactionController;

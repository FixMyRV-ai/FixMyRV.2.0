import { Router, RequestHandler } from "express";
import TransactionController from "../controllers/transaction.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const transactionRouter = Router();

// Apply auth middleware to all routes
transactionRouter.use(authMiddleware);

// Admin routes
transactionRouter.get(
  "/admin/all",
  TransactionController.getAllTransactions as RequestHandler
);

transactionRouter.get(
  "/admin/stats",
  TransactionController.getTransactionStats as RequestHandler
);

export default transactionRouter;

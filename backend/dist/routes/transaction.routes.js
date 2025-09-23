import { Router } from "express";
import TransactionController from "../controllers/transaction.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const transactionRouter = Router();
// Apply auth middleware to all routes
transactionRouter.use(authMiddleware);
// Admin routes
transactionRouter.get("/admin/all", TransactionController.getAllTransactions);
transactionRouter.get("/admin/stats", TransactionController.getTransactionStats);
export default transactionRouter;
//# sourceMappingURL=transaction.routes.js.map
import { Router } from "express";
import adminController from "../controllers/admin.controller";
import adminChatController from "../controllers/admin-chat.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

// SECURITY: Add authentication middleware to ALL admin routes
router.use(authMiddleware);

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.get("/sms-chats", adminChatController.getSMSChats);

export default router;
import { Router, RequestHandler } from "express";
import ChatController from "../controllers/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Chat routes
router.get("/", ChatController.getAllChats as unknown as RequestHandler);
router.post("/", ChatController.createChat as unknown as RequestHandler);
router.put("/:id", ChatController.updateChatTitle as unknown as RequestHandler);
router.delete("/:id", ChatController.deleteChat as unknown as RequestHandler);

// Message routes
router.get(
  "/:id/messages",
  ChatController.getChatMessages as unknown as RequestHandler
);

export default router;

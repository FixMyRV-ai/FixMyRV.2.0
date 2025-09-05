import { Router } from "express";
import ChatController from "../controllers/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
// Chat routes
router.get("/", ChatController.getAllChats);
router.post("/", ChatController.createChat);
router.put("/:id", ChatController.updateChatTitle);
router.delete("/:id", ChatController.deleteChat);
// Message routes
router.get("/:id/messages", ChatController.getChatMessages);
export default router;
//# sourceMappingURL=chat.routes.js.map
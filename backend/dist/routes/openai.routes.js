import { Router } from "express";
import openaiController from "../controllers/openai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
router.post("/chat", openaiController.chat);
export default router;
//# sourceMappingURL=openai.routes.js.map
import { Router, RequestHandler } from "express";
import openaiController from "../controllers/openai.controller";
import authMiddleware from "../middlewares/auth.middleware";
const router = Router();
router.use(authMiddleware);

router.post("/chat", openaiController.chat as RequestHandler);

export default router;

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import UserController from "../controllers/user.controller";

const router = Router();

router.get("/credits", authMiddleware, UserController.getCredits);
router.get("/:id", authMiddleware, UserController.getUser);
router.put("/:id", authMiddleware, UserController.updateUser);
router.delete("/:id", authMiddleware, UserController.deleteUser);

export default router;

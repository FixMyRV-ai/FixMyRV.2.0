import { Router } from "express";
import adminController from "../controllers/admin.controller";

const router = Router();

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);

export default router;
import { Router, RequestHandler } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { SettingController } from "../controllers/setting.controller";

const settingRouter = Router();

settingRouter.use(authMiddleware);

// Message routes
settingRouter.post("/", SettingController.update as RequestHandler);
settingRouter.get("/", SettingController.read as RequestHandler);

export default settingRouter;

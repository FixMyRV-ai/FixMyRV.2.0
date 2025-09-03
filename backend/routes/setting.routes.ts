import { Router, RequestHandler } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { SettingController } from "../controllers/setting.controller.js";

const settingRouter = Router();

settingRouter.use(authMiddleware);

// OpenAI Settings routes
settingRouter.post("/", SettingController.update as RequestHandler);
settingRouter.get("/", SettingController.read as RequestHandler);

// Twilio Settings routes
settingRouter.post("/twilio", SettingController.updateTwilioSettings as RequestHandler);
settingRouter.get("/twilio", SettingController.readTwilioSettings as RequestHandler);
settingRouter.post("/twilio/optin-message", SettingController.updateTwilioOptinMessage as RequestHandler);

export default settingRouter;

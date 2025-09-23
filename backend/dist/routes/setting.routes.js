import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { SettingController } from "../controllers/setting.controller.js";
const settingRouter = Router();
settingRouter.use(authMiddleware);
// OpenAI Settings routes
settingRouter.post("/", SettingController.update);
settingRouter.get("/", SettingController.read);
// Twilio Settings routes
settingRouter.post("/twilio", SettingController.updateTwilioSettings);
settingRouter.get("/twilio", SettingController.readTwilioSettings);
settingRouter.post("/twilio/optin-message", SettingController.updateTwilioOptinMessage);
export default settingRouter;
//# sourceMappingURL=setting.routes.js.map
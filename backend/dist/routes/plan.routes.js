import { Router } from "express";
import PlanController from "../controllers/plan.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const planRouter = Router();
planRouter.use(authMiddleware);
// Plan routes
planRouter.post("/", PlanController.createPlan);
planRouter.get("/", PlanController.getAllPlans);
planRouter.put("/:id", PlanController.updatePlan);
planRouter.put("/status/:id", PlanController.planStatus);
export default planRouter;
//# sourceMappingURL=plan.routes.js.map
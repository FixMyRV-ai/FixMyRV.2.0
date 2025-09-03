import { RequestHandler, Router } from "express";
import PlanController from "../controllers/plan.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const planRouter = Router();

planRouter.use(authMiddleware);

// Plan routes
planRouter.post("/", PlanController.createPlan as RequestHandler);
planRouter.get("/", PlanController.getAllPlans as RequestHandler);
planRouter.put("/:id", PlanController.updatePlan as RequestHandler);
planRouter.put("/status/:id", PlanController.planStatus as RequestHandler);

export default planRouter;

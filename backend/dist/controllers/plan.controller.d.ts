import { Request, Response } from "express";
declare class PlanController {
    static createPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getAllPlans(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updatePlan(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static planStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default PlanController;
//# sourceMappingURL=plan.controller.d.ts.map
import Stripe from "stripe";
import { Request, Response } from "express";
declare class StripeController {
    static createCheckoutSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getPlans(req: Request, res: Response): Promise<void>;
    static getSubscription(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static cancelSubscription(req: Request, res: Response): Promise<void>;
    static getCheckoutSession(req: Request, res: Response): Promise<void>;
    static handleWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static handleCheckoutSessionCompletedWebhook(event: Stripe.Event): Promise<void>;
    static handleInvoicePaymentSucceededWebhook(event: Stripe.Event): Promise<void>;
}
export default StripeController;
//# sourceMappingURL=stripe.controller.d.ts.map
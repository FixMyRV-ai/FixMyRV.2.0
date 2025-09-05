import { Request, Response } from "express";
declare class OpenaiController {
    constructor();
    chat(req: Request, res: Response): Promise<void>;
    deductUserCredits(userId: string, total_tokens: any): Promise<{
        success: boolean;
        reason: string;
        creditsDeducted?: undefined;
        creditsRemaining?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        creditsDeducted: any;
        creditsRemaining: any;
        reason?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        reason: string;
        error: any;
        creditsDeducted?: undefined;
        creditsRemaining?: undefined;
    }>;
}
declare const _default: OpenaiController;
export default _default;
//# sourceMappingURL=openai.controller.d.ts.map
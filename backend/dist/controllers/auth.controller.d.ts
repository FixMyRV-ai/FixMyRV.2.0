import { RequestHandler } from "express";
declare const authController: {
    sendConfirmationEmail(user: any): Promise<void>;
    register: RequestHandler;
    verifyEmail: RequestHandler;
    login: RequestHandler;
    forgotPassword: RequestHandler;
    resetPassword: RequestHandler;
    resendVerification: RequestHandler;
    changePassword: RequestHandler;
    updateProfile: RequestHandler;
    verifyPassword: RequestHandler;
};
export default authController;
//# sourceMappingURL=auth.controller.d.ts.map
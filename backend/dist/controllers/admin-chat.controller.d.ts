import { Request, Response } from "express";
interface AdminChatController {
    getSMSChats: (req: Request, res: Response) => Promise<void>;
}
declare const adminChatController: AdminChatController;
export default adminChatController;
//# sourceMappingURL=admin-chat.controller.d.ts.map
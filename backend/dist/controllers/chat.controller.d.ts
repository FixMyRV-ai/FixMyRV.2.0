import { Response } from "express";
import { AuthenticatedRequest } from "../types/user.js";
declare class ChatController {
    getAllChats(req: AuthenticatedRequest, res: Response): Promise<void>;
    createChat(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateChatTitle(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getChatMessages(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteChat(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: ChatController;
export default _default;
//# sourceMappingURL=chat.controller.d.ts.map
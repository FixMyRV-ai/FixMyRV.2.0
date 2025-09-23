import { Request, Response } from "express";
import { UserUpdateRequest } from "../types/user.js";
declare class UserController {
    getUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request<{
        id: string;
    }, {}, UserUpdateRequest>, res: Response): Promise<void>;
    deleteUser(req: Request<{
        id: string;
    }>, res: Response): Promise<void>;
    getCredits(req: Request, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map
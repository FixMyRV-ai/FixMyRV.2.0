import { Request, Response } from 'express';
declare class OrganizationUserController {
    getOrganizationUsers(req: Request, res: Response): Promise<void>;
    getOrganizationUserById(req: Request, res: Response): Promise<void>;
    createOrganizationUser(req: Request, res: Response): Promise<void>;
    updateOrganizationUser(req: Request, res: Response): Promise<void>;
    deleteOrganizationUser(req: Request, res: Response): Promise<void>;
    updateUserStatus(req: Request, res: Response): Promise<void>;
    getUsersByDepartment(req: Request, res: Response): Promise<void>;
    getDepartmentStats(req: Request, res: Response): Promise<void>;
    bulkUpdateUsers(req: Request, res: Response): Promise<void>;
    bulkDeleteUsers(req: Request, res: Response): Promise<void>;
    sendSMSInvite(req: Request, res: Response): Promise<void>;
}
declare const organizationUserController: OrganizationUserController;
export default organizationUserController;
//# sourceMappingURL=organizationUser.controller.d.ts.map
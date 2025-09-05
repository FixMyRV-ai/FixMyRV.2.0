import { Router } from "express";
import adminController from "../controllers/admin.controller.js";
import adminChatController from "../controllers/admin-chat.controller.js";
import OrganizationController from "../controllers/organization.controller.js";
import OrganizationUserController from "../controllers/organizationUser.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = Router();
// SECURITY: Add authentication middleware to ALL admin routes
router.use(authMiddleware);
router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.get("/sms-chats", adminChatController.getSMSChats);
// Organization admin routes
router.get("/organizations", OrganizationController.getOrganizations);
router.get("/organizations/:id", OrganizationController.getOrganization);
router.post("/organizations", OrganizationController.createOrganization);
router.put("/organizations/:id", OrganizationController.updateOrganization);
router.delete("/organizations/:id", OrganizationController.deleteOrganization);
// Organization users admin routes  
router.get("/organizations/:id/users", async (req, res) => {
    req.params.organizationId = req.params.id;
    return OrganizationUserController.getOrganizationUsers(req, res);
});
router.post("/organizations/:id/users", async (req, res) => {
    req.params.organizationId = req.params.id;
    return OrganizationUserController.createOrganizationUser(req, res);
});
router.delete("/organizations/:id/users/:userId", async (req, res) => {
    req.params.organizationId = req.params.id;
    return OrganizationUserController.deleteOrganizationUser(req, res);
});
export default router;
//# sourceMappingURL=admin.routes.js.map
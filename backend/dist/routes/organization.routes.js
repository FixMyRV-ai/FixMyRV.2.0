import { Router } from "express";
import OrganizationController from "../controllers/organization.controller.js";
import OrganizationUserController from "../controllers/organizationUser.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = Router();
// Apply authentication middleware to all routes
router.use(authMiddleware);
// Organization CRUD routes
router.get("/", OrganizationController.getOrganizations);
router.get("/:id", OrganizationController.getOrganization);
router.post("/", OrganizationController.createOrganization);
router.put("/:id", OrganizationController.updateOrganization);
router.delete("/:id", OrganizationController.deleteOrganization);
// Organization users management routes
router.get("/:id/users", async (req, res) => {
    // Transform the parameter from :id to :organizationId for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.getOrganizationUsers(req, res);
});
router.post("/:id/users", async (req, res) => {
    // Transform the parameter from :id to :organizationId for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.createOrganizationUser(req, res);
});
router.put("/:id/users/:userId", async (req, res) => {
    // Transform parameters for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.updateOrganizationUser(req, res);
});
router.delete("/:id/users/:userId", async (req, res) => {
    // Transform parameters for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.deleteOrganizationUser(req, res);
});
router.post("/:id/users/:userId/send-sms", async (req, res) => {
    // Transform parameters for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.sendSMSInvite(req, res);
});
// Legacy system user routes for backward compatibility
router.get("/:id/system-users", async (req, res) => {
    // Transform the parameter from :id to :organizationId for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.getOrganizationUsers(req, res);
});
router.post("/:id/add-system-user", async (req, res) => {
    // Transform the parameter from :id to :organizationId for the controller
    req.params.organizationId = req.params.id;
    return OrganizationUserController.createOrganizationUser(req, res);
});
router.delete("/:id/system-users/:userId", OrganizationController.removeUserFromOrganization);
export default router;
//# sourceMappingURL=organization.routes.js.map
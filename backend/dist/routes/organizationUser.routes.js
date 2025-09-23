import { Router } from "express";
import organizationUserController from "../controllers/organizationUser.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// Get all users for an organization
router.get("/:organizationId/users", organizationUserController.getOrganizationUsers);
// Get users grouped by department for an organization
router.get("/:organizationId/users/departments", organizationUserController.getUsersByDepartment);
// Get department statistics for an organization
router.get("/:organizationId/users/stats", organizationUserController.getDepartmentStats);
// Get a specific user in an organization
router.get("/:organizationId/users/:userId", organizationUserController.getOrganizationUserById);
// Create a new user in an organization
router.post("/:organizationId/users", organizationUserController.createOrganizationUser);
// Update a user in an organization
router.put("/:organizationId/users/:userId", organizationUserController.updateOrganizationUser);
// Update user status only
router.patch("/:organizationId/users/:userId/status", organizationUserController.updateUserStatus);
// Delete a user from an organization
router.delete("/:organizationId/users/:userId", organizationUserController.deleteOrganizationUser);
// Send SMS invite to user
router.post("/:organizationId/users/:userId/send-sms", organizationUserController.sendSMSInvite);
// Bulk operations
router.put("/:organizationId/users/bulk", organizationUserController.bulkUpdateUsers);
router.delete("/:organizationId/users/bulk", organizationUserController.bulkDeleteUsers);
export default router;
//# sourceMappingURL=organizationUser.routes.js.map
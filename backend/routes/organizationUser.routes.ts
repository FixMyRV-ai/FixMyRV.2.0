import { Router } from "express";
import organizationUserController from "../controllers/organizationUser.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all users for an organization
router.get("/organizations/:organizationId/users", organizationUserController.getOrganizationUsers);

// Get users grouped by department for an organization
router.get("/organizations/:organizationId/users/departments", organizationUserController.getUsersByDepartment);

// Get department statistics for an organization
router.get("/organizations/:organizationId/users/stats", organizationUserController.getDepartmentStats);

// Get a specific user in an organization
router.get("/organizations/:organizationId/users/:userId", organizationUserController.getOrganizationUserById);

// Create a new user in an organization
router.post("/organizations/:organizationId/users", organizationUserController.createOrganizationUser);

// Update a user in an organization
router.put("/organizations/:organizationId/users/:userId", organizationUserController.updateOrganizationUser);

// Update user status only
router.patch("/organizations/:organizationId/users/:userId/status", organizationUserController.updateUserStatus);

// Delete a user from an organization
router.delete("/organizations/:organizationId/users/:userId", organizationUserController.deleteOrganizationUser);

// Send SMS invite to user
router.post("/organizations/:organizationId/users/:userId/send-sms", organizationUserController.sendSMSInvite);

// Bulk operations
router.put("/organizations/:organizationId/users/bulk", organizationUserController.bulkUpdateUsers);
router.delete("/organizations/:organizationId/users/bulk", organizationUserController.bulkDeleteUsers);

export default router;

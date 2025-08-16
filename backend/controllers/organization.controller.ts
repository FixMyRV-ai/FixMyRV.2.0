import { RequestHandler } from "express";
import { Organization, User, OrganizationUser, sequelize } from "../models/index";
import { Op } from "sequelize";

class OrganizationController {
  // Get all organizations with pagination
  getOrganizations: RequestHandler = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (
        isNaN(pageNumber) ||
        isNaN(limitNumber) ||
        pageNumber <= 0 ||
        limitNumber <= 0
      ) {
        res.status(400).json({
          error: "Invalid pagination parameters. Page and limit must be positive integers.",
        });
        return;
      }

      const offset = (pageNumber - 1) * limitNumber;

      const { count, rows: organizations } = await Organization.findAndCountAll({
        offset,
        limit: limitNumber,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM "organization_users"
                WHERE "organization_users"."organizationId" = "Organization"."id"
                AND "organization_users"."deletedAt" IS NULL
              )`),
              "userCount",
            ],
          ],
        },
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Organizations fetched successfully",
        data: organizations,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limitNumber),
          currentPage: pageNumber,
          pageSize: limitNumber,
        },
      });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  };

  // Get single organization with users
  getOrganization: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      
      const organization = await Organization.findByPk(id, {
        include: [
          {
            model: OrganizationUser,
            as: "organizationUsers",
            attributes: ["id", "firstName", "lastName", "email", "role", "verified", "phone", "status", "createdAt"],
          },
        ],
      });

      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      res.status(200).json({
        message: "Organization fetched successfully",
        data: organization,
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  };

  // Create new organization
  createOrganization: RequestHandler = async (req, res) => {
    try {
      const { name, description, email, phone, address } = req.body;

      // Validate required fields
      if (!name || name.trim().length < 2) {
        res.status(400).json({ error: "Organization name is required and must be at least 2 characters" });
        return;
      }

      // Check if organization name already exists
      const existingOrg = await Organization.findOne({
        where: { name: name.trim() },
      });

      if (existingOrg) {
        res.status(400).json({ error: "Organization with this name already exists" });
        return;
      }

      const organization = await Organization.create({
        name: name.trim(),
        description: description?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      });

      res.status(201).json({
        message: "Organization created successfully",
        data: organization,
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  };

  // Update organization
  updateOrganization: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, email, phone, address } = req.body;

      const organization = await Organization.findByPk(id);

      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      // Validate required fields
      if (!name || name.trim().length < 2) {
        res.status(400).json({ error: "Organization name is required and must be at least 2 characters" });
        return;
      }

      // Check if organization name already exists (excluding current organization)
      const existingOrg = await Organization.findOne({
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        },
      });

      if (existingOrg) {
        res.status(400).json({ error: "Organization with this name already exists" });
        return;
      }

      await organization.update({
        name: name.trim(),
        description: description?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      });

      res.status(200).json({
        message: "Organization updated successfully",
        data: organization,
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  };

  // Delete organization
  deleteOrganization: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;

      const organization = await Organization.findByPk(id);

      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      // Check if organization has users
      const userCount = await User.count({
        where: { organizationId: id },
      });

      if (userCount > 0) {
        res.status(400).json({ 
          error: `Cannot delete organization. It has ${userCount} associated users. Please remove or reassign users first.`
        });
        return;
      }

      await organization.destroy();

      res.status(200).json({
        message: "Organization deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ error: "Failed to delete organization" });
    }
  };

  // Get users for a specific organization
  getOrganizationUsers: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (
        isNaN(pageNumber) ||
        isNaN(limitNumber) ||
        pageNumber <= 0 ||
        limitNumber <= 0
      ) {
        res.status(400).json({
          error: "Invalid pagination parameters. Page and limit must be positive integers.",
        });
        return;
      }

      // Verify organization exists
      const organization = await Organization.findByPk(id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      const offset = (pageNumber - 1) * limitNumber;

      const { count, rows: users } = await User.findAndCountAll({
        where: { organizationId: id },
        offset,
        limit: limitNumber,
        attributes: ["id", "firstName", "lastName", "email", "role", "verified", "createdAt"],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Organization users fetched successfully",
        data: users,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limitNumber),
          currentPage: pageNumber,
          pageSize: limitNumber,
        },
      });
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  };

  // Add user to organization
  addUserToOrganization: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params; // organization id
      const { userId } = req.body;

      // Verify organization exists
      const organization = await Organization.findByPk(id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      // Verify user exists
      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if user is already in an organization
      if (user.organizationId) {
        res.status(400).json({ error: "User is already assigned to an organization" });
        return;
      }

      // Add user to organization
      await user.update({ organizationId: id });

      res.status(200).json({
        message: "User added to organization successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error adding user to organization:", error);
      res.status(500).json({ error: "Failed to add user to organization" });
    }
  };

  // Remove user from organization
  removeUserFromOrganization: RequestHandler = async (req, res) => {
    try {
      const { id, userId } = req.params;

      // Verify organization exists
      const organization = await Organization.findByPk(id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }

      // Verify user exists and belongs to this organization
      const user = await User.findOne({
        where: { 
          id: userId,
          organizationId: id 
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found in this organization" });
        return;
      }

      // Remove user from organization
      await user.update({ organizationId: null });

      res.status(200).json({
        message: "User removed from organization successfully",
      });
    } catch (error) {
      console.error("Error removing user from organization:", error);
      res.status(500).json({ error: "Failed to remove user from organization" });
    }
  };
}

export default new OrganizationController();

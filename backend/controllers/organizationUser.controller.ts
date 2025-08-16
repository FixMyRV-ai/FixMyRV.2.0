import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { OrganizationUser, Organization, TwilioSetting } from '../models';
import twilio from 'twilio';

class OrganizationUserController {
  // Get all organization users with pagination and filtering
  async getOrganizationUsers(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        department = '', 
        status = '',
        role = ''
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      
      // Build where conditions
      const whereConditions: any = {
        organizationId: organizationId
      };

      if (search) {
        whereConditions[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (department) {
        whereConditions.department = department;
      }

      if (status) {
        whereConditions.status = status;
      }

      if (role) {
        whereConditions.role = role;
      }

      const { count, rows } = await OrganizationUser.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] },
        limit: Number(limit),
        offset: offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching organization users:', error);
      res.status(500).json({ error: 'Failed to fetch organization users' });
    }
  }

  // Get a specific organization user by ID
  async getOrganizationUserById(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;

      const user = await OrganizationUser.findOne({
        where: { 
          id: userId,
          organizationId: organizationId
        },
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        res.status(404).json({ error: 'Organization user not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching organization user:', error);
      res.status(500).json({ error: 'Failed to fetch organization user' });
    }
  }

  // Create a new organization user
  async createOrganizationUser(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const userData = req.body;
      const orgId = parseInt(organizationId, 10);

      // Verify organization exists
      const organization = await Organization.findByPk(orgId);
      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      // Check if email already exists in this organization
      const existingUser = await OrganizationUser.findOne({
        where: { 
          email: userData.email,
          organizationId: orgId
        }
      });

      if (existingUser) {
        res.status(400).json({ error: 'Email already exists in this organization' });
        return;
      }

      // Check if username already exists in this organization
      if (userData.username) {
        const existingUsername = await OrganizationUser.findOne({
          where: { 
            username: userData.username,
            organizationId: orgId
          }
        });

        if (existingUsername) {
          res.status(400).json({ error: 'Username already exists in this organization' });
          return;
        }
      }

      // Create the organization user
      const newUser = await OrganizationUser.create({
        ...userData,
        organizationId: orgId
      });

      // Fetch the created user with organization details
      const createdUser = await OrganizationUser.findByPk(newUser.id, {
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] }
      });

      res.status(201).json({
        message: 'Organization user created successfully',
        data: createdUser
      });
    } catch (error: any) {
      console.error('Error creating organization user:', error);
      
      // Handle specific database constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path || 'field';
        const value = error.errors?.[0]?.value || '';
        
        if (field === 'email') {
          res.status(400).json({ 
            error: `A user with email "${value}" already exists in this organization` 
          });
          return;
        } else if (field === 'username') {
          res.status(400).json({ 
            error: `Username "${value}" is already taken in this organization` 
          });
          return;
        } else {
          res.status(400).json({ 
            error: `This ${field} is already in use` 
          });
          return;
        }
      }
      
      // Handle validation errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err: any) => err.message);
        res.status(400).json({ 
          error: 'Validation failed', 
          details: validationErrors 
        });
        return;
      }
      
      // Generic server error
      res.status(500).json({ error: 'Failed to create organization user' });
    }
  }

  // Update an organization user
  async updateOrganizationUser(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;
      const updateData = req.body;

      // Find the user
      const user = await OrganizationUser.findOne({
        where: { 
          id: userId,
          organizationId: organizationId
        }
      });

      if (!user) {
        res.status(404).json({ error: 'Organization user not found' });
        return;
      }

      // Check for email conflicts (if email is being updated)
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await OrganizationUser.findOne({
          where: { 
            email: updateData.email,
            organizationId: organizationId,
            id: { [Op.ne]: userId }
          }
        });

        if (existingUser) {
          res.status(400).json({ error: 'Email already exists in this organization' });
          return;
        }
      }

      // Check for username conflicts (if username is being updated)
      if (updateData.username && updateData.username !== user.username) {
        const existingUsername = await OrganizationUser.findOne({
          where: { 
            username: updateData.username,
            organizationId: organizationId,
            id: { [Op.ne]: userId }
          }
        });

        if (existingUsername) {
          res.status(400).json({ error: 'Username already exists in this organization' });
          return;
        }
      }

      // Update the user
      await user.update(updateData);

      // Fetch updated user with organization details
      const updatedUser = await OrganizationUser.findByPk(userId, {
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating organization user:', error);
      res.status(500).json({ error: 'Failed to update organization user' });
    }
  }

  // Delete an organization user
  async deleteOrganizationUser(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;

      const user = await OrganizationUser.findOne({
        where: { 
          id: userId,
          organizationId: organizationId
        }
      });

      if (!user) {
        res.status(404).json({ error: 'Organization user not found' });
        return;
      }

      await user.destroy();
      res.json({ message: 'Organization user deleted successfully' });
    } catch (error) {
      console.error('Error deleting organization user:', error);
      res.status(500).json({ error: 'Failed to delete organization user' });
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended' });
        return;
      }

      const user = await OrganizationUser.findOne({
        where: { 
          id: userId,
          organizationId: organizationId
        }
      });

      if (!user) {
        res.status(404).json({ error: 'Organization user not found' });
        return;
      }

      await user.update({ status });

      const updatedUser = await OrganizationUser.findByPk(userId, {
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  // Get users by department
  async getUsersByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { department } = req.query;

      if (!department) {
        res.status(400).json({ error: 'Department parameter is required' });
        return;
      }

      const users = await OrganizationUser.findAll({
        where: { 
          organizationId: organizationId,
          department: department
        },
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] },
        order: [['firstName', 'ASC'], ['lastName', 'ASC']]
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users by department:', error);
      res.status(500).json({ error: 'Failed to fetch users by department' });
    }
  }

  // Get department statistics
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;

      const stats = await OrganizationUser.findAll({
        where: { organizationId: organizationId },
        attributes: [
          'department',
          [fn('COUNT', col('id')), 'userCount'],
          [fn('COUNT', literal("CASE WHEN status = 'active' THEN 1 END")), 'activeCount'],
          [fn('COUNT', literal("CASE WHEN status = 'inactive' THEN 1 END")), 'inactiveCount']
        ],
        group: ['department'],
        raw: true
      });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      res.status(500).json({ error: 'Failed to fetch department statistics' });
    }
  }

  // Bulk operations
  async bulkUpdateUsers(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { userIds, updateData } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: 'userIds must be a non-empty array' });
        return;
      }

      const [updatedCount] = await OrganizationUser.update(updateData, {
        where: {
          id: { [Op.in]: userIds },
          organizationId: organizationId
        }
      });

      res.json({ 
        message: `Successfully updated ${updatedCount} users`,
        updatedCount 
      });
    } catch (error) {
      console.error('Error bulk updating users:', error);
      res.status(500).json({ error: 'Failed to bulk update users' });
    }
  }

  async bulkDeleteUsers(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: 'userIds must be a non-empty array' });
        return;
      }

      const deletedCount = await OrganizationUser.destroy({
        where: {
          id: { [Op.in]: userIds },
          organizationId: organizationId
        }
      });

      res.json({ 
        message: `Successfully deleted ${deletedCount} users`,
        deletedCount 
      });
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      res.status(500).json({ error: 'Failed to bulk delete users' });
    }
  }

  // Send SMS invite to organization user
  async sendSMSInvite(req: Request, res: Response): Promise<void> {
    console.log('=== SMS INVITE REQUEST RECEIVED ===');
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);
    console.log('Request Headers Authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    try {
      const { organizationId, userId } = req.params;
      console.log('SMS Invite Request - Organization ID:', organizationId, 'User ID:', userId);

      // Find the user
      const user = await OrganizationUser.findOne({
        where: { 
          id: userId,
          organizationId: organizationId
        },
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!user) {
        console.log('User not found for SMS invite');
        res.status(404).json({ error: 'Organization user not found' });
        return;
      }

      console.log('User found for SMS:', user.firstName, user.lastName, user.phone);

      // Get Twilio settings
      const twilioSettings = await TwilioSetting.findOne();
      if (!twilioSettings || !twilioSettings.accountSid || !twilioSettings.authToken || !twilioSettings.phoneNumber) {
        console.log('Twilio settings not configured');
        res.status(500).json({ error: 'Twilio settings not configured. Please configure Twilio settings first.' });
        return;
      }

      console.log('Twilio settings found - Phone:', twilioSettings.phoneNumber);

      // Initialize Twilio client
      const client = twilio(twilioSettings.accountSid, twilioSettings.authToken);

      // Send SMS
      try {
        console.log('Attempting to send SMS to:', user.phone);
        const message = await client.messages.create({
          body: twilioSettings.optinMessage || 'Your Phone Number has been associated with a FixMyRV.ai service account. To confirm and Opt-In, please respond "YES" to this message. At any moment you can stop all messages from us, by texting back "STOP".',
          from: twilioSettings.phoneNumber,
          to: user.phone
        });

        console.log('SMS sent successfully - SID:', message.sid, 'Status:', message.status);

        // Update user status to 'invited'
        await user.update({ status: 'invited' });

        // Create a clean user response object without password
        const userResponse = {
          id: user.id,
          organizationId: user.organizationId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          verified: user.verified,
          phone: user.phone,
          department: user.department,
          jobTitle: user.jobTitle,
          hireDate: user.hireDate,
          status: 'invited',
          notes: user.notes,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          organization: user.organization
        };

        res.json({ 
          success: true,
          message: 'SMS invite sent successfully',
          user: userResponse,
          sms: {
            sid: message.sid,
            status: message.status,
            to: user.phone
          }
        });
      } catch (twilioError: any) {
        console.error('Twilio SMS Error:', twilioError);
        res.status(500).json({ 
          error: 'Failed to send SMS invite',
          details: twilioError.message || 'Unknown Twilio error'
        });
        return;
      }
    } catch (error) {
      console.error('Error sending SMS invite:', error);
      res.status(500).json({ error: 'Failed to send SMS invite' });
    }
  }
}

const organizationUserController = new OrganizationUserController();
export default organizationUserController;

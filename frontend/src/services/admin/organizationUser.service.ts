import BaseService from "../base.service";
import {
  OrganizationUsersResponse,
  OrganizationUserResponse,
  OrganizationUserCreateResponse,
  OrganizationUserDepartmentsResponse,
  CreateOrganizationUserData,
  UpdateOrganizationUserData,
  OrganizationUserQuery,
  UpdateStatusData,
} from "@/types/organizationUser";

class OrganizationUserService extends BaseService {
  constructor() {
    super("");
  }

  // Get all users for an organization
  async getOrganizationUsers(
    organizationId: number,
    params: OrganizationUserQuery = {}
  ): Promise<OrganizationUsersResponse> {
    const queryString = new URLSearchParams();
    
    if (params.page) queryString.append("page", params.page.toString());
    if (params.limit) queryString.append("limit", params.limit.toString());
    if (params.search) queryString.append("search", params.search);
    if (params.status) queryString.append("status", params.status);
    if (params.role) queryString.append("role", params.role);
    if (params.department) queryString.append("department", params.department);

    const url = `/organizations/${organizationId}/users${queryString.toString() ? `?${queryString.toString()}` : ""}`;
    return await this.get(url);
  }

  // Get users grouped by department for an organization
  async getOrganizationUsersByDepartment(
    organizationId: number
  ): Promise<OrganizationUserDepartmentsResponse> {
    return await this.get(`/organizations/${organizationId}/users/departments`);
  }

  // Get a specific user in an organization
  async getOrganizationUser(
    organizationId: number,
    userId: number
  ): Promise<OrganizationUserResponse> {
    return await this.get(`/organizations/${organizationId}/users/${userId}`);
  }

  // Create a new user in an organization
  async createOrganizationUser(
    organizationId: number,
    userData: CreateOrganizationUserData
  ): Promise<OrganizationUserCreateResponse> {
    return await this.post(`/organizations/${organizationId}/users`, userData);
  }

  // Update a user in an organization
  async updateOrganizationUser(
    organizationId: number,
    userId: number,
    userData: Partial<UpdateOrganizationUserData>
  ): Promise<OrganizationUserCreateResponse> {
    return await this.put(`/organizations/${organizationId}/users/${userId}`, userData);
  }

  // Update user status only
  async updateOrganizationUserStatus(
    organizationId: number,
    userId: number,
    statusData: UpdateStatusData
  ): Promise<OrganizationUserCreateResponse> {
    return await this.patch(`/organizations/${organizationId}/users/${userId}/status`, statusData);
  }

  // Delete a user from an organization
  async deleteOrganizationUser(
    organizationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    return await this.delete(`/organizations/${organizationId}/users/${userId}`);
  }

  // Bulk operations
  async bulkUpdateStatus(
    organizationId: number,
    userIds: number[],
    status: "active" | "inactive" | "suspended"
  ): Promise<{ success: boolean; message: string }> {
    const promises = userIds.map(userId =>
      this.updateOrganizationUserStatus(organizationId, userId, { status })
    );
    
    await Promise.all(promises);
    return { success: true, message: `Successfully updated ${userIds.length} users` };
  }

  async bulkDelete(
    organizationId: number,
    userIds: number[]
  ): Promise<{ success: boolean; message: string }> {
    const promises = userIds.map(userId =>
      this.deleteOrganizationUser(organizationId, userId)
    );
    
    await Promise.all(promises);
    return { success: true, message: `Successfully deleted ${userIds.length} users` };
  }

  // Send SMS invite to organization user
  async sendSMSInvite(
    organizationId: number,
    userId: number
  ): Promise<{ 
    success: boolean; 
    message: string; 
    user: OrganizationUserCreateResponse;
    sms: { sid: string; status: string; to: string; } 
  }> {
    return await this.post(`/organizations/${organizationId}/users/${userId}/send-sms`, {});
  }

  // Export users data
  async exportOrganizationUsers(
    organizationId: number,
    format: "csv" | "xlsx" = "csv"
  ): Promise<Blob> {
    return await this.get(`/organizations/${organizationId}/users/export?format=${format}`);
  }

  // Import users data
  async importOrganizationUsers(
    organizationId: number,
    file: File
  ): Promise<{ success: boolean; message: string; imported: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append("file", file);
    
    return await this.post(`/organizations/${organizationId}/users/import`, formData);
  }
}

const organizationUserService = new OrganizationUserService();
export default organizationUserService;

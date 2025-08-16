import BaseService from "../base.service";
import {
  OrganizationResponse,
  OrganizationsResponse,
  OrganizationUsersResponse,
  CreateOrganizationData,
  UpdateOrganizationData,
} from "@/types/organization";

class OrganizationService extends BaseService {
  constructor() {
    super("/organizations");
  }

  // Get all organizations with pagination
  async getOrganizations(params: { page?: number; limit?: number } = {}): Promise<OrganizationsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    const url = queryParams.toString() ? `/?${queryParams.toString()}` : "/";
    return await this.get(url);
  }

  // Get single organization with users
  async getOrganization(id: number): Promise<OrganizationResponse> {
    return await this.get(`/${id}`);
  }

  // Create new organization
  async createOrganization(data: CreateOrganizationData): Promise<OrganizationResponse> {
    return await this.post("/", data);
  }

  // Update organization
  async updateOrganization(id: number, data: UpdateOrganizationData): Promise<OrganizationResponse> {
    return await this.put(`/${id}`, data);
  }

  // Delete organization
  async deleteOrganization(id: number): Promise<{ message: string }> {
    return await this.delete(`/${id}`);
  }

  // Get organization users
  async getOrganizationUsers(
    id: number,
    params: { page?: number; limit?: number } = {}
  ): Promise<OrganizationUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    const url = queryParams.toString() ? `/${id}/users?${queryParams.toString()}` : `/${id}/users`;
    return await this.get(url);
  }

  // Add user to organization
  async addUserToOrganization(organizationId: number, userId: number): Promise<{ message: string; data: any }> {
    return await this.post(`/${organizationId}/users`, { userId });
  }

  // Remove user from organization
  async removeUserFromOrganization(organizationId: number, userId: number): Promise<{ message: string }> {
    return await this.delete(`/${organizationId}/users/${userId}`);
  }
}

export default new OrganizationService();

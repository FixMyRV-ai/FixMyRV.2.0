export interface Organization {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  userCount?: number;
  users?: OrganizationUser[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
  verified: boolean;
  createdAt: string;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateOrganizationData extends CreateOrganizationData {
  id: number;
}

export interface OrganizationResponse {
  message: string;
  data: Organization;
}

export interface OrganizationsResponse {
  message: string;
  data: Organization[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface OrganizationUsersResponse {
  message: string;
  data: OrganizationUser[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

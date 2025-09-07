// Organization User Types
export interface OrganizationUserBase {
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin" | "manager";
  phone: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string | Date;
  status: "active" | "inactive" | "suspended" | "new_user" | "invited";
  notes?: string;
}

export interface CreateOrganizationUserData extends OrganizationUserBase {
  password: string;
}

export interface UpdateOrganizationUserData extends Partial<OrganizationUserBase> {
  id: number;
  password?: string;
}

export interface OrganizationUserFull extends OrganizationUserBase {
  id: number;
  organizationId: number;
  verified: boolean;
  verificationToken?: string;
  profileImage?: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  organization?: {
    id: number;
    name: string;
  };
}

// API Response Types
export interface OrganizationUsersResponse {
  success: boolean;
  data: OrganizationUserFull[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface OrganizationUserResponse {
  success: boolean;
  data: OrganizationUserFull;
}

export interface OrganizationUserCreateResponse extends OrganizationUserResponse {
  message: string;
}

export interface OrganizationUserDepartment {
  department: string;
  userCount: number;
  users: OrganizationUserFull[];
}

export interface OrganizationUserDepartmentsResponse {
  success: boolean;
  data: OrganizationUserDepartment[];
}

// Query Parameters
export interface OrganizationUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  department?: string;
}

// Form Data
export interface OrganizationUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: "user" | "admin" | "manager";
  phone: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  status: "active" | "inactive" | "suspended";
  notes: string;
}

// Status Update
export interface UpdateStatusData {
  status: "active" | "inactive" | "suspended";
}

import { User } from "@/types/auth";
import BaseService from "../base.service";
import { ApiResponseWithPagination } from "@/types/content";

class UsersService extends BaseService {
  constructor() {
    super("/admin/users");
  }

  async getUsers(params: {
    page: number;
    limit: number;
  }): Promise<ApiResponseWithPagination<User[]>> {
    const { page, limit } = params;
    try {
      const response = await this.get<ApiResponseWithPagination<User[]>>(
        `/?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

}

export default new UsersService();

import BaseService from "../base.service";

export interface TransactionUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  webUrls: number;
  driveFiles: number;
  uploadedFiles: number;
  totalChats: number;
}

class DashboardService extends BaseService {
  constructor() {
    super("/admin");
  }

  async getDashboardData(): Promise<DashboardStats> {
    return await this.get("/dashboard");
  }
}

export default new DashboardService();

import BaseService from "../base.service";
import {
  TransactionResponse,
  TransactionStatsResponse,
} from "@/types/transaction";

class TransactionService extends BaseService {
  constructor() {
    super("/transaction");
  }

  getAllTransactions = async (
    page = 1,
    limit = 10,
    filters?: {
      status?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }
    ): Promise<TransactionResponse> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.userId) queryParams.append("userId", filters.userId);
      if (filters?.startDate)
        queryParams.append("startDate", filters.startDate);
      if (filters?.endDate) queryParams.append("endDate", filters.endDate);

      const response = await this.get<TransactionResponse>(
        `/admin/all?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  };

  updateTransactionStatus = async (
    id: string,
    status: string
  ): Promise<TransactionResponse> => {
    try {
      const response = await this.patch<TransactionResponse>(
        `/admin/${id}/status`,
        { status }
      );
      return response;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  };

  getTransactionStats = async (
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<TransactionStatsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (limit) queryParams.append("limit", limit.toString());
      const response = await this.get<TransactionStatsResponse>(
        `/admin/stats?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
      throw error;
    }
  };
}

export default new TransactionService();

import BaseService from "../base.service";
import { Plan, PlanResponse } from "@/types/plan";

interface PaginatedResponse<T> {
  plans: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

class PlanService extends BaseService {
  constructor() {
    super("/plan");
  }

  async createPlan(plan: Plan): Promise<PlanResponse> {
    return this.post("/", plan);
  }

  async getAllPlans(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<PlanResponse>> {
    return this.get(`/?page=${page}&limit=${limit}`);
  }

  async updatePlan(id: string, plan: Plan): Promise<PlanResponse> {
    return this.put(`/${id}`, plan);
  }

  async planStatus(id: string, active: boolean): Promise<void> {
    return this.put(`/status/${id}`, { active });
  }
}

export default PlanService;

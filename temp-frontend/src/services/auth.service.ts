import {
  LoginResponse,
  RegisterResponse,
  User,
  LoginCredentials,
  RegisterCredentials,
  ForgotPassword,
  ResetPassword,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "@/types/auth";
import BaseService from "./base.service";
import { NavigateFunction } from "react-router-dom";

// Authentication Service
class AuthService extends BaseService {
  constructor() {
    super("/auth");
  }
  async register(data: RegisterCredentials): Promise<RegisterResponse> {
    return await this.post("/register", data);
  }

  async login(data: LoginCredentials): Promise<LoginResponse> {
    return await this.post("/login", data);
  }

  async getProfile(): Promise<User> {
    return await this.get("/profile");
  }

  async updateProfile(data: User): Promise<User> {
    return await this.put("/profile", data);
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    return await this.put("/change-password", data);
  }

  async forgotPassword(data: ForgotPassword): Promise<ForgotPasswordResponse> {
    return await this.post("/forgot-password", data);
  }

  async resetPassword(data: ResetPassword): Promise<ResetPasswordResponse> {
    return await this.post("/reset-password", data);
  }

  redirectBasedOnUserType(role: string,  navigate: NavigateFunction): void {
    navigate(role === "admin" ? "/admin/dashboard" : "/chat/new");
  }
  redirectBasedOntype(type: string,  navigate: NavigateFunction): void {
    navigate(type === "normal" ? "/upgrade" : "/chat/new");
  }
}

export default new AuthService();

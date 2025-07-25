import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  currentPassword?: string;
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  token?: string;
  newPassword?: string;
  role?: string;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  stripeCustomerId?: string;
  credits?: number;
  plan_type?: "subscription" | "payment";
  type?: "normal" | "pro";
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface UserDeleteRequest {
  id: string;
}

export interface UserGetRequest {
  id: string;
}

export interface UserJwtPayload extends JwtPayload {
  id: number;
  email: string;
  stripeCustomerId: string;
  role: "user" | "admin";
  plan_type: "subscription" | "payment";
  credits: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserJwtPayload;
}

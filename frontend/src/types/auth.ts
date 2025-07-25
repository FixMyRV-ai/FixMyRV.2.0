import { ReactNode } from "react";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

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
  credits?: number;
  type?: "pro" | "normal";
  chatCount?: string;
  plan_type?: "subscription" | "payment";
  [key: string]: string | number | boolean | Date | undefined;
}

export interface JwtPayload {
  exp: number;
  [key: string]: unknown;
}

export interface AuthProps {
  children: ReactNode;
  isAuth?: boolean;
  isAdmin?: boolean;
  isPro?: boolean;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface ForgotPassword {
  email: string;
}
export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPassword {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

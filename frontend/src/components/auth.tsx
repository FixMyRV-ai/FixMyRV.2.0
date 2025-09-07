import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Helpers from "@/config/helpers";
import authSlice from "@/store/slices/authSlice";
import { AuthProps } from "@/types/auth";

const Auth: React.FC<AuthProps> = ({
  children,
  isAuth = true,
  isPro = false,
  isAdmin = false,
}) => {
  const { user, token, clearUser } = authSlice();
  const navigate = useNavigate();

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return !decoded.exp || decoded.exp < currentTime;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (token) {
      // Initial check
      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        Helpers.toast("error", "Session expired. Please login again.");
        navigate("/login");
        return;
      }

      const checkInterval = setInterval(() => {
        if (isTokenExpired(token)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          Helpers.toast("error", "Session expired. Please login again.");
          navigate("/login");
          clearInterval(checkInterval);
        }
      }, 60000);

      return () => clearInterval(checkInterval);
    }
  }, [token, navigate]);

  const getRedirectPath = (): string | null => {
    if (token && isTokenExpired(token)) {
      clearUser();
      Helpers.toast("error", "Session expired. Please login again.");
      navigate("/login");
      return null;
    }

    if (!isAuth) {
      if (user && token) {
        return user.role === "admin"
          ? "/admin/dashboard"
          : user.type === "pro" || (user.credits && user.credits > 0)
          ? "/chat/new"
          : "/upgrade";
      }
      return null;
    }

    if (!user || !token) {
      Helpers.toast("error", "Please login to continue.");
      return "/login";
    }

    if (isAdmin && user.role !== "admin") {
      Helpers.toast(
        "error",
        "Access denied. Only administrators can access this area."
      );
      return "/admin/dashboard";
    }

    if (!isAdmin && user.role === "admin") {
      Helpers.toast("error", "Access denied. Please use the admin dashboard.");
      return "/admin/dashboard";
    }

    if (isPro && user.type !== "pro" && (!user.credits || user.credits === 0)) {
      Helpers.toast(
        "error",
        "Access denied. Please upgrade or purchase credits to continue."
      );
      return "/upgrade";
    }

    return null;
  };

  const redirectPath = getRedirectPath();
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default Auth;

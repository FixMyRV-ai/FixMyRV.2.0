import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Helpers from "@/config/helpers";
import authService from "@/services/auth.service";
import { LoginCredentials } from "@/types/auth";
import authSlice from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

interface APIError {
  response?: {
    data?: {
      message: string;
    };
  };
}

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setCredits } = authSlice();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      const response = await authService.login(formData);
      setUser(response.user);
      setToken(response.token);
      setCredits(response.user.credits || 0);

      if (response.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (response.user.type === "pro" || (response.user.credits && response.user.credits > 0)) {
        navigate("/chat/new");
      } else {
        navigate("/upgrade");
      }

      Helpers.toast("success", response.message);
    } catch (err: unknown) {
      const error = err as APIError;
      setError(
        error.response?.data?.message || "An error occurred during Login"
      );
      Helpers.toast(
        "error",
        error.response?.data?.message || "An error occurred during Login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-card-foreground">
          Login
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your details to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-card-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Label htmlFor="password" className="text-card-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            variant="link"
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-primary hover:text-primary/80"
          >
            Forgot Password
          </Button>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center text-muted-foreground text-sm">
          Don't have an account?{" "}
          <Button
            variant="link"
            onClick={() => navigate("/register")}
            className="text-primary hover:text-primary/80"
          >
            Register
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Login;

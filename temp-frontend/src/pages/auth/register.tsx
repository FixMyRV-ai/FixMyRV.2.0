import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import Helpers from "@/config/helpers";
import authService from "@/services/auth.service";
import { RegisterCredentials } from "@/types/auth";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterCredentials>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev: RegisterCredentials) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      Helpers.toast("error", "Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!formData.termsAccepted) {
      Helpers.toast("error", "Please accept the terms and conditions");
      setIsLoading(false);
      return;
    }
    try {
      const response = await authService.register(formData);
      Helpers.toast("success", response.message);
      navigate("/login");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message: string;
        errors: Record<string, string>;
      }>;
      if (axiosError.response) {
        setErrors(axiosError.response.data.errors || {});
        Helpers.toast(
          "error",
          axiosError.response.data.message || "Registration failed"
        );
      } else if (axiosError.request) {
        Helpers.toast(
          "error",
          "No response from server. Please try again later."
        );
      } else {
        Helpers.toast(
          "error",
          "An unexpected error occurred. Please try again."
        );
        console.error("Error during registration:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-card-foreground">
          Create an Account
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your details to register
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-card-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <p className="text-destructive text-sm">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-card-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && (
                <p className="text-destructive text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

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
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email}</p>
            )}
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
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password}</p>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="confirmPassword" className="text-card-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-sm">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) =>
                setFormData((prev: RegisterCredentials) => ({
                  ...prev,
                  termsAccepted: e.target.checked,
                }))
              }
            />
            <Label
              htmlFor="termsAccepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-card-foreground"
            >
              I agree to the Terms and Conditions
            </Label>
            {errors.termsAccepted && (
              <p className="text-destructive text-sm">{errors.termsAccepted}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>

        <div className="mt-4 text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="text-primary hover:text-primary/80"
          >
            Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Register;

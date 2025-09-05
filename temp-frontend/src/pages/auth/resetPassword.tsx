import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "@/services/auth.service";
import Helpers from "@/config/helpers";
import { Loader2, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      formData.newPassword !== formData.confirmPassword ||
      formData.newPassword === ""
    ) {
      Helpers.toast("error", "Passwords do not match or password is empty");
      return;
    }
    try {
      setIsLoading(true);
      const response = await authService.resetPassword({
        ...formData,
        token: token!,
        email: email!,
      });
      Helpers.toast("success", response.message);
      navigate("/login");
    } catch (error: unknown) {
      console.error(error);
      Helpers.toast("error", "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-card-foreground">
          Reset Password
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="newPassword" className="text-card-foreground">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              className="my-2 pr-10"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-card-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              className="my-2 pr-10"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
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
        </div>
        <Button
          type="submit"
          onClick={(e) =>
            handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
          }
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Reset Password"}
        </Button>
        <div className="mt-4 text-center text-muted-foreground text-sm">
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="text-primary hover:text-primary/80"
          >
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;

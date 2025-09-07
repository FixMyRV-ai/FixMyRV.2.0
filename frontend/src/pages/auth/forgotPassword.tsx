import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Helpers from "@/config/helpers";
import { useNavigate } from "react-router-dom";
import authService from "@/services/auth.service";
import { Loader2, Eye } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email) {
      Helpers.toast("error", "Email is required");
      return;
    }
    try {
      setIsLoading(true);
      const response = await authService.forgotPassword(formData);
      Helpers.toast("success", response.message);
    } catch (error: unknown) {
      console.error(error);
      Helpers.toast("error", "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-card-foreground">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your email to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="email" className="text-card-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="my-2 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Eye className="h-4 w-4" />
            </div>
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
            type="button"
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

export default ForgotPassword;

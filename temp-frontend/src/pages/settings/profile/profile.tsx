import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef, useCallback } from "react";
import { Eye, EyeOff, User, Lock, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { User as UserType } from "@/types/auth";
import Helpers from "@/config/helpers";
import authService from "@/services/auth.service";
import authSlice from "@/store/slices/authSlice";

const ProfileSettings = () => {
  const { user, updateUser } = authSlice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async () => {
    try {
      setIsLoading(true);
      await authService.updateProfile({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        profileImage: avatarPreview || user?.profileImage,
      });
      updateUser({
        ...user,
        profileImage: avatarPreview || user?.profileImage,
      });
      Helpers.toast("success", "Profile updated successfully!");
    } catch (error) {
      Helpers.toast("error", error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      setIsLoading(true);
      await authService.changePassword({
        currentPassword: user?.currentPassword || "",
        newPassword: user?.newPassword || "",
      });
      Helpers.toast("success", "Password updated successfully!");
      updateUser({
        ...user,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      Helpers.toast("error", error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = useCallback(
    (name: "currentPassword" | "newPassword" | "confirmPassword", label: string, showPassword: boolean, setShowPassword: (show: boolean) => void) => (
      <div className="relative group">
        <Input
          type={showPassword ? "text" : "password"}
          id={name}
          value={user?.[name as keyof UserType] as string}
          onChange={(e) => updateUser({ ...user, [name]: e.target.value })}
          className="bg-background/50 border-border/50 focus:border-primary pr-10 transition-colors"
          placeholder={label}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    ),
    [user,updateUser]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Profile Settings</h2>
          <p className="text-muted-foreground">Manage your profile information and security settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-6">
            <Avatar
              className="w-32 h-32 cursor-pointer transition-transform hover:scale-105"
              onClick={handleAvatarClick}
            >
              <AvatarImage src={avatarPreview || user?.profileImage || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="bg-gray-300 text-white text-xl">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleAvatarClick}>
              <Upload className="w-4 h-4" />
              Upload Photo
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              value={user?.firstName}
              placeholder="First Name"
              onChange={(e) => updateUser({ ...user, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Input
              value={user?.lastName}
              placeholder="Last Name"
              onChange={(e) => updateUser({ ...user, lastName: e.target.value })}
            />
          </div>

          <div className="relative">
            <Input value={user?.email} disabled className="bg-muted/50 pr-10" />
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">Email cannot be changed</p>

          <Button
            type="submit"
            onClick={handleProfileSubmit}
            className="w-full transition-all duration-300 shadow-lg hover:shadow-primary/25"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Save Profile"}
          </Button>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          {renderPasswordInput("currentPassword", "Current Password", showCurrentPassword, setShowCurrentPassword)}
          {renderPasswordInput("newPassword", "New Password", showNewPassword, setShowNewPassword)}
          {renderPasswordInput("confirmPassword", "Confirm New Password", showConfirmPassword, setShowConfirmPassword)}

          <Button
            type="submit"
            onClick={handlePasswordSubmit}
            className="w-full text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-primary/25"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Update Password"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileSettings;

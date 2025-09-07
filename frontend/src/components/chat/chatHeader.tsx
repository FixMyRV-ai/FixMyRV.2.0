import UserMenu from "./userMenu";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SidebarIcon } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import UserService from "@/services/user/user.service";
import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import authSlice from "@/store/slices/authSlice";
import CreditTracker from "./creditTracker";
import { useNavigate } from "react-router-dom";
interface ChatHeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}
export interface ChatHeaderRef {
  fetchCredits: () => Promise<void>;
}
const ChatHeader = forwardRef<ChatHeaderRef, ChatHeaderProps>(
  ({ isCollapsed, onToggleSidebar }, ref) => {
    const navigate = useNavigate();
    const [credits, setCredits] = useState(0);
    const { updateUser, user } = authSlice();

    const fetchCredits = useCallback(async () => {
      try {
        const response = await UserService.getUserCredits();

        // Check the response structure and extract credits
        if (
          response &&
          response.credits !== null &&
          response.credits !== undefined
        ) {
          setCredits(response.credits);

          // Also update the user store
          updateUser({ credits: response.credits });
        } else {
          console.error("Invalid credits response structure:", response);
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    }, [updateUser]);

    // Fetch credits when component mounts
    useEffect(() => {
      fetchCredits();
    }, [fetchCredits]);

    // Expose fetchCredits method via ref
    useImperativeHandle(ref, () => ({
      fetchCredits,
    }));
    return (
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 sm:h-16 items-center px-2 sm:px-6">
          {/* Left section */}
          {location.pathname !== "/upgrade" && (
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="hover:bg-muted h-8 w-8 sm:h-10 sm:w-10"
              >
                <SidebarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              {isCollapsed && (
                <div className="flex justify-center">
                  <img
                    src="/assets/logo.png"
                    alt="logo"
                    className="w-16 sm:w-24 h-auto"
                  />
                </div>
              )}
            </div>
          )}
          {location.pathname === "/upgrade" &&
            (user?.type === "pro" ||
              (user?.type === "normal" && credits !== 0)) && (
              <div className="flex items-start justify-start my-2">
                <Button onClick={() => navigate("/chat/new")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go To Chat
                </Button>
              </div>
            )}
          {/* Right section */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-6">
            <ModeToggle />

            <div className="flex items-center gap-2 sm:gap-4">
              <div
                className="hidden sm:block p-2 border-2 rounded-md border-blue-600 bg-blue-100 "
                onClick={() => navigate("/upgrade")}
              >
                <CreditTracker credits={credits} />
              </div>
              <div
                className="sm:hidden px-2 py-1 border-2 rounded-md border-blue-600 bg-blue-100"
                onClick={() => navigate("/upgrade")}
              >
                <CreditTracker credits={credits} compact={true} />
              </div>
              <div className="pl-1 sm:pl-2 border-l">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
);

export default ChatHeader;

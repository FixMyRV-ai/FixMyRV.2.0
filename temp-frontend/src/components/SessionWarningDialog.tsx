import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface SessionWarningDialogProps {
  open: boolean;
  onKeepLoggedIn: () => void;
  onLogout: () => void;
}

const SessionWarningDialog = ({
  open,
  onKeepLoggedIn,
  onLogout,
}: SessionWarningDialogProps) => {
  const [countdown, setCountdown] = useState(60); // 60 seconds countdown

  useEffect(() => {
    if (!open) {
      setCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout(); // Auto logout when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onLogout]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session About to Expire
          </DialogTitle>
          <DialogDescription>
            Your session will expire in <span className="font-bold text-red-600">{countdown}</span> seconds due to inactivity.
            <br />
            Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="text-gray-600"
          >
            Logout
          </Button>
          <Button 
            onClick={onKeepLoggedIn}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Keep Logged In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionWarningDialog;

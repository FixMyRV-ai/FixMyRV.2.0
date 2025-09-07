import { Link, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreditCard, User, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SettingsLayout = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/chat/new");
  };

  const userNavItems = [
    {
      icon: User,
      label: "Profile",
      href: "/settings/profile",
    },
    {
      icon: CreditCard,
      label: "Subscription",
      href: "/settings/subscription",
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Settings</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto p-6 max-w-7xl h-full">
          <div className="flex flex-col lg:flex-row gap-8 h-full bg-background/60 backdrop-blur-xl rounded-lg border shadow-sm">
            {/* Navigation Sidebar */}
            <div className="w-full lg:w-64 shrink-0 p-4 border-b lg:border-r lg:border-b-0">
              <nav className="space-y-1">
                {userNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;

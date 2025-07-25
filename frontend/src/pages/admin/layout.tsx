import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
  UserRound,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import authSlice from "@/store/slices/authSlice";
import { File } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";

const Layout = () => {
  const { clearUser } = authSlice();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const pathname = useLocation();
  const [items, setItems] = useState([
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
      active: false,
    },
    { icon: Users, label: "Users", path: "/admin/users", active: false },
    {
      icon: CreditCard,
      label: "Transactions",
      path: "/admin/transactions",
      active: false,
    },
    {
      icon: UserRound,
      label: "Profile",
      path: "/admin/profile",
      active: false,
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      active: false,
    },
    {
      icon: File,
      label: "Content",
      path: "/admin/content",
      active: false,
    },
    {
      icon: Package,
      label: "Plans",
      path: "/admin/plans",
      active: false,
    },
  ]);

  useEffect(() => {
    const path = pathname.pathname;
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        active: item.path === path,
      }))
    );
  }, [pathname]);

  return (
    <div className="flex min-h-screen body">
      {/* Mobile/Responsive Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-card shadow-md border-r border-border transition-all duration-300 ease-in-out h-screen",
          "md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-border px-4">
          {!isCollapsed && (
            <div className="flex justify-center items-center w-full">
              <img
                src="/assets/logo.png"
                alt="logo"
                className="w-16 sm:w-24 h-auto"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="h-screen">
          <nav className="p-4 space-y-2">
            {items.map((item, index) => (
              <Button
                key={index}
                onClick={() => navigate(item.path)}
                variant={item.active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center px-2",
                  item.active
                    ? "text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && item.label}
              </Button>
            ))}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={cn(
                "w-full justify-start items-end text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Logout"}
            </Button>
          </nav>
        </ScrollArea>
      </aside>

      <main
        className={cn(
          "flex-1 p-6 overflow-y-auto transition-all duration-300",
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <div
          className={`flex justify-between pb-2 ${
            isCollapsed ? "justify-between" : "justify-end"
          }`}
        >
          {isCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="text-6xl font-bold">
                <img
                  src="/assets/logo.png"
                  alt="logo"
                  className="w-24 sm:w-32 h-auto"
                />
              </div>
            </Link>
          )}
          <ModeToggle />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

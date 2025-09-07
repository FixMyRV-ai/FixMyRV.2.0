import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Globe,
  HardDrive,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardService, {
  DashboardStats,
} from "@/services/admin/dashboard.service";

interface AnalyticsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  onClick: () => void;
}

// Analytics Card Component
const AnalyticsCard = ({
  icon: Icon,
  title,
  value,
  change,
  positive,
  onClick,
}: AnalyticsCardProps) => (
  <Card
    className="bg-card shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-card-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-card-foreground">{value}</div>
      {change && (
        <p
          className={cn(
            "text-xs",
            positive ? "text-green-600" : "text-red-600"
          )}
        >
          {positive ? "+" : "-"}
          {change}% from last month
        </p>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await DashboardService.getDashboardData();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl text-foreground font-bold">Dashboard</h2>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <AnalyticsCard
          icon={Users}
          onClick={() => navigate("/admin/users")}
          title="Total Users"
          value={stats?.totalUsers?.toString() || "0"}
        />
        <AnalyticsCard
          icon={Users}
          onClick={() => navigate("/admin/users")}
          title="Active Users"
          value={stats?.activeUsers?.toString() || "0"}
        />
        <AnalyticsCard
          icon={MessageSquare}
          onClick={() => navigate("/admin/users")}
          title="Total Chats"
          value={stats?.totalChats?.toString() || "0"}
        />
        <AnalyticsCard
          icon={FileText}
          onClick={() => navigate("/admin/content")}
          title="Total Files"
          value={stats?.totalFiles?.toString() || "0"}
        />
        <AnalyticsCard
          icon={Globe}
          onClick={() => navigate("/admin/content")}
          title="Web URLs"
          value={stats?.webUrls?.toString() || "0"}
        />
        <AnalyticsCard
          icon={HardDrive}
          onClick={() => navigate("/admin/content")}
          title="Drive Files"
          value={stats?.driveFiles?.toString() || "0"}
        />
      </div>
    </main>
  );
}

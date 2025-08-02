import ActivityIcon from "@/assets/icons/ActivityIcon";
import BuildingIcon from "@/assets/icons/BuildingIcon";
import CreditCardIcon from "@/assets/icons/CreditCardIcon";
import UsersIcon from "@/assets/icons/UsersIcon";

export interface SystemMetricType {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
}

export const SYMMETRIC_INFO: SystemMetricType[] = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+12%",
    trend: "up",
    icon: <UsersIcon className="w-5 h-5" />,
  },
  {
    title: "Organizations",
    value: "1,249",
    change: "+8%",
    trend: "up",
    icon: <BuildingIcon className="w-5 h-5" />,
  },
  {
    title: "System Health",
    value: "99.9%",
    change: "0%",
    trend: "stable",
    icon: <ActivityIcon className="w-5 h-5" />,
  },
  {
    title: "Revenue",
    value: "$847K",
    change: "+15%",
    trend: "up",
    icon: <CreditCardIcon className="w-5 h-5" />,
  },
];

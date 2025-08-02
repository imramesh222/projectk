import ActivityIcon from "@/assets/icons/ActivityIcon";
import BarChartIcon from "@/assets/icons/BarChartIcon";
import BuildingIcon from "@/assets/icons/BuildingIcon";
import CreditCardIcon from "@/assets/icons/CreditCardIcon";
import NotificationIcon from "@/assets/icons/NotificationIcon";
import ShieldIcon from "@/assets/icons/ShieldIcon";
import UsersIcon from "@/assets/icons/UsersIcon";

export const NAVITEMS = [
  {
    id: "overview",
    label: "Overview",
    link: "overview",
    icon: <BarChartIcon className="w-4 h-4" />,
  },
  {
    id: "users",
    label: "User Management",
    link: "user-management",
    icon: <UsersIcon className="w-4 h-4" />,
  },
  {
    id: "organizations",
    label: "Organizations",
    link: "organizations",
    icon: <BuildingIcon className="w-4 h-4" />,
  },
  {
    id: "projects",
    label: "Projects",
    link: "projects",
    icon: <CreditCardIcon className="w-4 h-4" />,
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    link: "roles-permissions",
    icon: <ShieldIcon className="w-4 h-4" />,
  },
  {
    id: "audit",
    label: "Audit & Logs",
    link: "audit-logs",
    icon: <ActivityIcon className="w-4 h-4" />,
  },
  {
    id: "reports",
    label: "Reports",
    link: "reports",
    icon: <BarChartIcon className="w-4 h-4" />,
  },
  // {
  //   id: "integrations",
  //   label: "Integrations",

  //   icon: <SettingIcon className="w-4 h-4" />,
  // },
  {
    id: "notifications",
    label: "Notifications",
    link: "notifications",
    icon: <NotificationIcon className="w-4 h-4" />,
  },
  {
    id: "billing",
    label: "Payment & Billing",
    link: "payment-billing",
    icon: <CreditCardIcon className="w-4 h-4" />,
  },
  // {
  //   id: "maintenance",
  //   label: "Maintenance",
  //   icon: <WrenchIcon className="w-4 h-4" />,
  // },
];

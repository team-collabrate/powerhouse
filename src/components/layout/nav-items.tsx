import {
  BarChart2,
  Briefcase,
  CreditCard,
  FileText,
  PieChart,
  Settings,
  Users,
} from "react-feather";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

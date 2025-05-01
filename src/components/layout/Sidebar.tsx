import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingBag,
  Utensils,
  Package,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Database,
  Download,
  LayoutDashboard,
  Store,
  UserCog,
  Car,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Home, label: "Home", path: "/home" },
    { icon: Users, label: "User Management", path: "/users" },
    { icon: UserCog, label: "Restaurant Owners", path: "/restaurant-owners" },
    { icon: Store, label: "Restaurants", path: "/restaurants" },
    { icon: Car, label: "Drivers", path: "/drivers" },
    { icon: ShoppingBag, label: "Orders", path: "/orders", badge: 12 },
    { icon: Utensils, label: "Menu Items", path: "/menu-items" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: TrendingUp, label: "Analytics", path: "/analytics" },
    { icon: Database, label: "Data Models", path: "/data-models" },
    { icon: FileText, label: "Documentation", path: "/documentation" },
    { icon: AlertCircle, label: "Debug", path: "/debug" },
    { icon: HelpCircle, label: "Support", path: "/support" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full w-64 bg-orange-600 text-white",
        className,
      )}
    >
      <div className="p-4 border-b border-orange-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center">
            <div className="h-5 w-5 rounded-sm bg-orange-600" />
          </div>
          <span className="text-xl font-bold">FoodBase</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-4">
          <p className="text-xs font-semibold text-orange-300 mb-2 px-3">
            MAIN MENU
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-white/10 text-white"
                    : "text-orange-100 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-orange-700">
        <div className="bg-orange-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center mb-3">
            <img
              src="/vite.svg"
              alt="App icon"
              className="h-12 w-12 bg-white p-2 rounded-lg"
            />
          </div>
          <p className="text-sm font-medium text-center mb-2">
            Download our SDK
          </p>
          <p className="text-xs text-orange-200 text-center mb-3">
            for easy integration
          </p>
          <Button
            variant="secondary"
            className="w-full bg-white text-orange-700 hover:bg-orange-50"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download SDK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

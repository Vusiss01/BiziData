import React from "react";
import { Bell, Search, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

const Header = ({ userName, userAvatar }: HeaderProps) => {
  const { user, logout, isDemoAccount } = useAuth();
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();

  // Use profile name from database if available, fall back to props or auth metadata
  const displayName = userName || (profile ? profile.name : user?.user_metadata?.name) || "User";
  const avatarUrl =
    userAvatar ||
    user?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4">
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isDemoAccount && (
          <div className="hidden md:flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-md border border-orange-200">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Demo Account</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-1">
                  Hello, {displayName}!
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem>API Keys</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;

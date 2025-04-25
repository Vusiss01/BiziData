import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { changeUserRole, UserRole } from "@/services/userService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";

interface RoleAssignmentDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profile_image_url?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  
  // Use our custom error handler
  const { 
    error, 
    isLoading, 
    handleAsync, 
    clearError 
  } = useErrorHandler({
    component: 'RoleAssignmentDialog',
    showToast: true,
  });
  
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
  };
  
  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      toast({
        title: "No Change",
        description: "The role is the same as before.",
      });
      onClose();
      return;
    }
    
    await handleAsync(
      async () => {
        const result = await changeUserRole(user.id, selectedRole);
        
        if (result.error) {
          throw result.error;
        }
        
        toast({
          title: "Success",
          description: `Role updated to ${formatRoleName(selectedRole)}`,
        });
        
        onSuccess();
        onClose();
        
        return result.data;
      },
      {
        action: 'changeUserRole',
        category: ErrorCategory.DATABASE,
        context: { userId: user.id, newRole: selectedRole },
        userMessage: "Failed to update user role. Please try again.",
      }
    );
  };
  
  // Helper function to format role name
  const formatRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return "Administrator";
      case 'owner':
        return "Restaurant Owner";
      case 'driver':
        return "Driver";
      case 'customer':
        return "Customer";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };
  
  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-purple-100 text-purple-800";
      case 'owner':
        return "bg-blue-100 text-blue-800";
      case 'driver':
        return "bg-green-100 text-green-800";
      case 'customer':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-500" />
          Assign Role
        </DialogTitle>
        <DialogDescription>
          Change the role for this user to grant or restrict permissions.
        </DialogDescription>
      </DialogHeader>
      
      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={clearError}
          variant="compact"
        />
      )}
      
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profile_image_url} />
          <AvatarFallback className="bg-orange-100 text-orange-800">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm font-medium">Current Role:</div>
        <Badge className={getRoleBadgeColor(user.role)}>
          {formatRoleName(user.role)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">New Role</Label>
        <Select
          value={selectedRole}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger id="role" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="owner">Restaurant Owner</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {selectedRole === 'admin' && "Administrators have full access to all features."}
          {selectedRole === 'owner' && "Restaurant owners can manage their restaurants and menus."}
          {selectedRole === 'driver' && "Drivers can manage their deliveries and availability."}
          {selectedRole === 'customer' && "Customers can place orders and view their order history."}
        </p>
      </div>
      
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Role"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RoleAssignmentDialog;

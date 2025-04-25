import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Car,
  Store,
  Filter,
  ShieldAlert
} from "lucide-react";
import { getUsers, getUsersByRole, UserRole, UserData } from "@/services/userService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import { useDebounce } from "@/utils/uiUtils";
import AddOwnerForm from "@/components/users/AddOwnerForm";
import AddDriverForm from "@/components/users/AddDriverForm";
import RoleAssignmentDialog from "@/components/users/RoleAssignmentDialog";

const UserManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOwnerDialogOpen, setIsAddOwnerDialogOpen] = useState(false);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Use our custom error handler
  const {
    error,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'UserManagementPage',
    showToast: true,
  });

  // Fetch users based on active tab
  useEffect(() => {
    fetchUsers();
  }, [activeTab, debouncedSearchQuery, refreshKey]);

  const fetchUsers = async () => {
    await handleAsync(
      async () => {
        let result;

        const options = {
          search: debouncedSearchQuery || undefined,
          orderBy: 'created_at',
          orderDirection: 'desc' as 'asc' | 'desc',
        };

        switch (activeTab) {
          case 'owners':
            result = await getUsersByRole('owner', options);
            break;
          case 'drivers':
            result = await getUsersByRole('driver', options);
            break;
          case 'admins':
            result = await getUsersByRole('admin', options);
            break;
          default:
            result = await getUsers(options);
            break;
        }

        if (result.error) {
          throw result.error;
        }

        setUsers(result.data || []);
        return result.data;
      },
      {
        action: 'fetchUsers',
        category: ErrorCategory.DATABASE,
        context: { activeTab, searchQuery: debouncedSearchQuery },
        userMessage: "Failed to load users. Please try again.",
      }
    );
  };

  const handleAddUser = (userType: 'owner' | 'driver') => {
    if (userType === 'owner') {
      setIsAddOwnerDialogOpen(true);
    } else {
      setIsAddDriverDialogOpen(true);
    }
  };

  const handleUserAdded = () => {
    // Refresh the user list
    setRefreshKey(prev => prev + 1);

    // Show success toast
    toast({
      title: "Success",
      description: "User added successfully",
    });
  };

  const handleOpenRoleDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleRoleUpdated = () => {
    // Refresh the user list
    setRefreshKey(prev => prev + 1);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'owner':
        return <Badge className="bg-blue-100 text-blue-800">Restaurant Owner</Badge>;
      case 'driver':
        return <Badge className="bg-green-100 text-green-800">Driver</Badge>;
      case 'customer':
        return <Badge className="bg-gray-100 text-gray-800">Customer</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage users, restaurant owners, and drivers</p>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddUser('owner')}>
                <Store className="h-4 w-4 mr-2" />
                Add Restaurant Owner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddUser('driver')}>
                <Car className="h-4 w-4 mr-2" />
                Add Driver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="owners">Restaurant Owners</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderUserTable()}
        </TabsContent>

        <TabsContent value="owners" className="mt-6">
          {renderUserTable()}
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          {renderUserTable()}
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          {renderUserTable()}
        </TabsContent>
      </Tabs>

      {/* Add Owner Dialog */}
      <Dialog open={isAddOwnerDialogOpen} onOpenChange={setIsAddOwnerDialogOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <AddOwnerForm
            onClose={() => setIsAddOwnerDialogOpen(false)}
            onSuccess={handleUserAdded}
          />
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={isAddDriverDialogOpen} onOpenChange={setIsAddDriverDialogOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <AddDriverForm
            onClose={() => setIsAddDriverDialogOpen(false)}
            onSuccess={handleUserAdded}
          />
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen && selectedUser !== null} onOpenChange={setIsRoleDialogOpen}>
        {selectedUser && (
          <RoleAssignmentDialog
            user={selectedUser}
            onClose={() => {
              setIsRoleDialogOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={handleRoleUpdated}
          />
        )}
      </Dialog>
    </div>
  );

  function renderUserTable() {
    if (error) {
      return (
        <ErrorDisplay
          error={error}
          onRetry={fetchUsers}
          onDismiss={clearError}
        />
      );
    }

    if (loading && users.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-500">Loading users...</p>
          </div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-500 mt-2">
              {debouncedSearchQuery
                ? `No users matching "${debouncedSearchQuery}"`
                : "Get started by adding a new user"}
            </p>
            <div className="mt-6">
              <Button
                onClick={() => handleAddUser('owner')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profile_image_url || undefined} />
                      <AvatarFallback className="bg-orange-100 text-orange-800">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>{new Date(user.created_at || "").toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Assign Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default UserManagementPage;

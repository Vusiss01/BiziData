import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddOwnerForm from "@/components/users/AddOwnerForm";
import { useAuth } from "@/hooks/useAuth";
import { getRestaurantOwners } from "@/services/userService";
import { getRestaurantsByOwnerId } from "@/services/restaurantService";
import useErrorHandler from "@/hooks/useErrorHandler";
import { ErrorCategory } from "@/utils/errorHandler";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RestaurantOwnersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const { user } = useAuth();

  // Use our custom error handler
  const {
    error: fetchError,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'RestaurantOwnersPage',
    showToast: true,
  });

  // Function to fetch restaurant owners
  const fetchOwners = async () => {
    if (!user) return;

    await handleAsync(
      async () => {
        console.log("Fetching restaurant owners...");

        try {
          // Fetch users with owner role
          const { data: owners, error } = await getRestaurantOwners();

          if (error) {
            console.error("Error fetching restaurant owners:", error);

            // If in development, use mock data
            if (process.env.NODE_ENV === 'development') {
              console.log("Using mock owners data due to error");
              setOwners(mockOwners);
              return mockOwners;
            }

            throw error;
          }

          if (!owners || owners.length === 0) {
            console.log("No restaurant owners found, using mock data");
            setOwners(mockOwners);
            return mockOwners;
          }

          console.log(`Found ${owners.length} restaurant owners, fetching their restaurants...`);

          // Fetch restaurants for each owner
          const ownersWithRestaurants = await Promise.all(
            owners.map(async (owner) => {
              try {
                console.log(`Fetching restaurants for owner ${owner.id} (${owner.name})`);
                const { data: restaurants, error: restaurantError } = await getRestaurantsByOwnerId(owner.id);

                if (restaurantError) {
                  console.warn(`Error fetching restaurants for owner ${owner.id}:`, restaurantError);
                }

                // Determine status based on user data or default to verified
                const status = owner.status || (owner.is_verified ? 'verified' : 'pending');

                return {
                  ...owner,
                  restaurants: restaurants?.map(r => r.name) || [],
                  status: status,
                  joinDate: owner.created_at
                    ? new Date(owner.created_at).toISOString().split('T')[0]
                    : 'Unknown'
                };
              } catch (error) {
                console.error(`Error processing restaurants for owner ${owner.id}:`, error);
                return {
                  ...owner,
                  restaurants: [],
                  status: owner.status || 'verified',
                  joinDate: owner.created_at
                    ? new Date(owner.created_at).toISOString().split('T')[0]
                    : 'Unknown'
                };
              }
            })
          );

          console.log("Successfully processed all restaurant owners with their restaurants");
          setOwners(ownersWithRestaurants);
          return ownersWithRestaurants;
        } catch (error) {
          console.error("Error in fetchOwners:", error);

          // In development, always fall back to mock data
          if (process.env.NODE_ENV === 'development') {
            console.log("Using mock owners data due to error");
            setOwners(mockOwners);
            return mockOwners;
          }

          throw error;
        }
      },
      {
        action: 'fetchOwners',
        category: ErrorCategory.DATABASE,
        userMessage: "Failed to fetch restaurant owners. Please try again.",
      }
    );
  };

  // Fetch restaurant owners from the database
  useEffect(() => {
    fetchOwners();
  }, [user]);

  // Fallback mock data if no owners found
  const mockOwners = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      restaurants: ["Pizza Palace", "Pasta Paradise"],
      status: "verified",
      joinDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      restaurants: ["Burger Bonanza"],
      status: "verified",
      joinDate: "2023-02-20",
    },
    {
      id: "3",
      name: "Michael Wong",
      email: "m.wong@example.com",
      restaurants: ["Sushi Supreme", "Noodle House"],
      status: "pending",
      joinDate: "2023-03-10",
    },
    {
      id: "4",
      name: "Lisa Garcia",
      email: "lisa.g@example.com",
      restaurants: ["Taco Time"],
      status: "pending",
      joinDate: "2023-04-05",
    },
  ];

  // Use mock data if no owners found and not loading
  // This is now handled in the fetchOwners function
  useEffect(() => {
    if (!loading && owners.length === 0 && process.env.NODE_ENV === 'development') {
      console.log("No owners found after loading, using mock data");
      setOwners(mockOwners);
    }
  }, [loading]);

  const filteredOwners = owners.filter((owner) =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurant Owners</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Owner
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search owners..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Restaurants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.name}`} />
                        <AvatarFallback>
                          <UserCog className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{owner.name}</div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {owner.restaurants.map((restaurant, index) => (
                        <div key={index} className="text-sm">
                          {restaurant}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        owner.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {owner.status === "verified" ? "Verified" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell>{owner.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Owner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden">
          <AddOwnerForm
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={() => {
              // Refresh the owners list
              fetchOwners();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantOwnersPage;

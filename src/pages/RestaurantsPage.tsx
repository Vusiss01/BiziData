import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Store,
  Plus,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  DollarSign,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import AddRestaurantForm from "@/components/restaurants/AddRestaurantForm";
import { getAllRestaurants } from "@/services/restaurantService";

// We're using the global QueryClient from main.tsx

// Import the Restaurant interface from the service
import { Restaurant } from '@/services/restaurantService';
import { isRestaurantOpen, getTodayHours } from '@/utils/restaurantUtils';
import { getUserById } from '@/services/userService';

const RestaurantsContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all restaurants using React Query
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ["allRestaurants", sortBy, sortOrder, statusFilter],
    queryFn: async () => {
      try {
        console.log("Fetching all restaurants from Firebase");
        const allRestaurants = await getAllRestaurants();

        // Filter by status if needed
        let filteredRestaurants = allRestaurants;
        if (statusFilter !== "all") {
          filteredRestaurants = allRestaurants.filter(
            (restaurant) => restaurant.status === statusFilter
          );
        }

        // Sort restaurants
        return filteredRestaurants.sort((a, b) => {
          // Handle dates for created_at
          if (sortBy === "created_at") {
            // Convert to Date objects, handling Timestamps
            let dateA: Date;
            let dateB: Date;

            if (a.created_at instanceof Date) {
              dateA = a.created_at;
            } else if (a.created_at && typeof a.created_at === 'object' && 'toDate' in a.created_at) {
              dateA = a.created_at.toDate();
            } else {
              dateA = new Date(0); // Default to epoch if invalid
            }

            if (b.created_at instanceof Date) {
              dateB = b.created_at;
            } else if (b.created_at && typeof b.created_at === 'object' && 'toDate' in b.created_at) {
              dateB = b.created_at.toDate();
            } else {
              dateB = new Date(0); // Default to epoch if invalid
            }

            return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
          }

          // Handle strings (name, etc.)
          if (typeof a[sortBy as keyof typeof a] === "string" && typeof b[sortBy as keyof typeof b] === "string") {
            const valueA = (a[sortBy as keyof typeof a] as string).toLowerCase();
            const valueB = (b[sortBy as keyof typeof b] as string).toLowerCase();
            return sortOrder === "desc" ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
          }

          // Handle numbers (rating, etc.)
          const valueA = a[sortBy as keyof typeof a] as number || 0;
          const valueB = b[sortBy as keyof typeof b] as number || 0;
          return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
        });
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        throw err;
      }
    },
  });

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants
    ? restaurants.filter(
        (restaurant) =>
          restaurant.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          restaurant.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          restaurant.address?.city
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          restaurant.cuisine?.some((c) =>
            c.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : [];

  // Restaurant Owner component
  const RestaurantOwner = ({ ownerId }: { ownerId?: string }) => {
    const { data: owner, isLoading } = useQuery({
      queryKey: ['owner', ownerId],
      queryFn: async () => {
        if (!ownerId) return null;
        const result = await getUserById(ownerId);
        return result.data;
      },
      enabled: !!ownerId,
    });

    if (isLoading) {
      return <div className="flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</div>;
    }

    if (!owner) {
      return <span className="text-gray-500">No owner assigned</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          {owner.profile_image_url ? (
            <AvatarImage src={owner.profile_image_url} alt={owner.name} />
          ) : (
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${owner.name}`} alt={owner.name} />
          )}
          <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span>{owner.name}</span>
      </div>
    );
  };

  // Function to format the date
  function formatDate(dateValue: any) {
    if (!dateValue) return "Unknown date";

    let date: Date;

    // Handle different date types
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
      // Handle Firestore Timestamp
      date = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      // Handle string date
      date = new Date(dateValue);
    } else {
      console.warn("Unknown date format:", dateValue);
      return "Unknown date";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateValue);
      return "Unknown date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Function to render price range
  const renderPriceRange = (range?: number) => {
    if (!range) return "N/A";

    const dollars = [];
    for (let i = 0; i < range; i++) {
      dollars.push(<DollarSign key={i} className="h-4 w-4 inline" />);
    }
    return <div className="flex">{dollars}</div>;
  };

  // Function to render rating
  const renderRating = (rating?: number) => {
    if (!rating) return "N/A";

    return (
      <div className="flex items-center">
        <span className="mr-1">{rating.toFixed(1)}</span>
        <Star className="h-4 w-4 text-yellow-500 inline" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
        <p className="text-lg">Loading restaurants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <div>
          <p className="text-lg font-medium">Error loading restaurants</p>
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // Handle refreshing the restaurants list after adding a new restaurant
  const handleRestaurantAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["allRestaurants"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowAddRestaurantModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Add Restaurant Modal */}
      <Dialog open={showAddRestaurantModal} onOpenChange={setShowAddRestaurantModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
          </DialogHeader>
          <AddRestaurantForm
            onSuccess={handleRestaurantAdded}
            onClose={() => setShowAddRestaurantModal(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search restaurants..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4 mr-1" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
              Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
              Pending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              Sort: {sortBy === "created_at" ? "Date" : sortBy}
              {sortOrder === "desc" ? " (Newest)" : " (Oldest)"}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setSortBy("created_at");
                setSortOrder("desc");
              }}
            >
              Date (Newest)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy("created_at");
                setSortOrder("asc");
              }}
            >
              Date (Oldest)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy("name");
                setSortOrder("asc");
              }}
            >
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy("name");
                setSortOrder("desc");
              }}
            >
              Name (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy("rating");
                setSortOrder("desc");
              }}
            >
              Rating (Highest)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Open Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Store className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-lg font-medium">No restaurants found</p>
                      <p className="text-sm">
                        {searchQuery
                          ? "Try adjusting your search or filters"
                          : "Add your first restaurant to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          {restaurant.display_picture ? (
                            <AvatarImage
                              src={restaurant.display_picture}
                              alt={restaurant.name}
                            />
                          ) : (
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${restaurant.name}`}
                              alt={restaurant.name}
                            />
                          )}
                          <AvatarFallback className="rounded-md">
                            <Store className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {restaurant.description || "No description"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {restaurant.address ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span>
                            {restaurant.address.city || "Unknown location"}
                            {restaurant.address.state
                              ? `, ${restaurant.address.state}`
                              : ""}
                          </span>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisine && restaurant.cuisine.length > 0 ? (
                          restaurant.cuisine.slice(0, 2).map((type, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-orange-50"
                            >
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                        {restaurant.cuisine && restaurant.cuisine.length > 2 && (
                          <Badge variant="outline">
                            +{restaurant.cuisine.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderPriceRange(restaurant.priceRange)}</TableCell>
                    <TableCell>{renderRating(restaurant.rating)}</TableCell>
                    <TableCell>
                      <RestaurantOwner ownerId={restaurant.owner_id} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          isRestaurantOpen(restaurant.working_hours)
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {isRestaurantOpen(restaurant.working_hours) ? "Open" : "Closed"}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {getTodayHours(restaurant.working_hours)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          restaurant.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : restaurant.status === "inactive"
                            ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {restaurant.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(restaurant.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link
                              to={`/restaurants/${restaurant.id}`}
                              className="flex w-full"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component
const RestaurantsPage = () => {
  console.log("Rendering RestaurantsPage component");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Restaurants Page</h1>
      <RestaurantsContent />
    </div>
  );
};

export default RestaurantsPage;

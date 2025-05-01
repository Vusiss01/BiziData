import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { db } from "@/lib/firebase";

// We're using the global QueryClient from main.tsx

// Define the Restaurant interface based on your Firestore schema
interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  cuisine?: string[];
  priceRange?: number;
  rating?: number;
  status?: string;
  created_at: Date | string;
  owner_id?: string;
}

const RestaurantsContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all restaurants using React Query
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ["allRestaurants", sortBy, sortOrder],
    queryFn: async () => {
      try {
        console.log("Fetching all restaurants from Firebase");

        // Import necessary Firebase functions
        const { collection, query, orderBy, getDocs, where } = await import(
          "firebase/firestore"
        );

        // Create base query
        let restaurantsQuery = query(
          collection(db, "restaurants"),
          orderBy(sortBy, sortOrder)
        );

        // Add status filter if not "all"
        if (statusFilter !== "all") {
          restaurantsQuery = query(
            collection(db, "restaurants"),
            where("status", "==", statusFilter),
            orderBy(sortBy, sortOrder)
          );
        }

        // Execute query
        const snapshot = await getDocs(restaurantsQuery);

        console.log(`Query returned ${snapshot.docs.length} restaurants`);

        // Process results
        const restaurantData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            address: data.address,
            contact: data.contact,
            cuisine: data.cuisine,
            priceRange: data.priceRange,
            rating: data.rating,
            status: data.status || "active",
            created_at: data.created_at?.toDate?.() || data.created_at,
            owner_id: data.owner_id,
          };
        });

        return restaurantData;
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

  // Function to format the date
  function formatDate(dateValue: Date | string) {
    if (!dateValue) return "Unknown date";

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

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
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
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
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${restaurant.name}`}
                            alt={restaurant.name}
                          />
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

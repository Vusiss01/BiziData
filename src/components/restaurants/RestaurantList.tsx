import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRestaurants, RestaurantFilterOptions } from "@/services/restaurantService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock, AlertCircle } from "lucide-react";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import { getStatusColor, formatStatus } from "@/utils/uiUtils";

interface RestaurantListProps {
  limit?: number;
  showOwnerOnly?: boolean;
  onRestaurantClick?: (restaurantId: string) => void;
  searchQuery?: string;
  statusFilter?: string[];
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  limit,
  showOwnerOnly = false,
  onRestaurantClick,
  searchQuery = "",
  statusFilter = ['active', 'pending_verification'],
}) => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);

  // Use our custom error handler
  const {
    error,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'RestaurantList',
    showToast: false, // We'll handle errors in the UI
  });

  const fetchRestaurants = async () => {
    await handleAsync(
      async () => {
        const options: RestaurantFilterOptions = {
          limit,
          status: statusFilter,
        };

        if (showOwnerOnly && user) {
          options.owner_id = user.id;
        }

        if (searchQuery) {
          options.search = searchQuery;
        }

        const { data, error, count } = await getRestaurants(options);

        if (error) {
          throw error;
        }

        setRestaurants(data || []);
        return data;
      },
      {
        action: 'fetchRestaurants',
        category: ErrorCategory.DATABASE,
        context: { showOwnerOnly, limit, searchQuery, statusFilter },
        userMessage: "Failed to load restaurants. Please try again.",
      }
    );
  };

  useEffect(() => {
    fetchRestaurants();
  }, [user, limit, showOwnerOnly, searchQuery, statusFilter.join(',')]);

  const handleRestaurantClick = (restaurantId: string) => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurantId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        title="Error Loading Restaurants"
        onRetry={fetchRestaurants}
        onDismiss={clearError}
      />
    );
  }

  if (restaurants.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-600">No Restaurants Found</CardTitle>
          <CardDescription>
            {showOwnerOnly
              ? "You don't have any restaurants yet."
              : "There are no restaurants available."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            {showOwnerOnly
              ? "Create a new restaurant to get started."
              : "Check back later for new restaurants."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => {
        // Get the first location if available
        const location = restaurant.restaurant_locations?.[0];

        return (
          <Card
            key={restaurant.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRestaurantClick(restaurant.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{restaurant.name}</CardTitle>
                  {location && (
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location.street}, {location.suburb}, {location.city}
                    </CardDescription>
                  )}
                </div>
                <StatusBadge status={restaurant.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {restaurant.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{restaurant.rating.toFixed(1)}</span>
                  </div>
                )}

                {location && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{location.status === 'open' ? 'Open' : 'Closed'}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestaurantClick(restaurant.id);
                }}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

// Helper component for status badge
const StatusBadge = ({ status }: { status: string }) => {
  const colorClass = getStatusColor(status);
  const formattedStatus = formatStatus(status);

  return <Badge className={colorClass}>{formattedStatus}</Badge>;
};

export default RestaurantList;

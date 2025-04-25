import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SimpleAddRestaurantForm from "@/components/restaurants/SimpleAddRestaurantForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWorkingHours } from "@/utils/workingHoursStorage";

interface Restaurant {
  id: string;
  name: string;
  status: string;
  logo_url?: string;
  cover_page_url?: string;
  created_at?: string;
  restaurant_locations?: {
    suburb: string;
    city: string;
  }[];
}

const BasicRestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      // Query to get restaurants with their locations
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          id,
          name,
          status,
          logo_url,
          cover_page_url,
          created_at,
          restaurant_locations (suburb, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Fetched restaurants:", data);
      setRestaurants(data || []);
    } catch (err: any) {
      console.error("Error fetching restaurants:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const formatLocation = (restaurant: Restaurant) => {
    if (restaurant.restaurant_locations && restaurant.restaurant_locations.length > 0) {
      const location = restaurant.restaurant_locations[0];
      return `${location.suburb}, ${location.city}`;
    }
    return "No location specified";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Add Restaurant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <SimpleAddRestaurantForm
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={fetchRestaurants}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-2" />
            <p className="text-gray-500">Loading restaurants...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchRestaurants}
          >
            Try Again
          </Button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No restaurants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              {restaurant.cover_page_url && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={restaurant.cover_page_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/orange/white?text=Restaurant';
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {restaurant.logo_url && (
                      <div className="w-10 h-10 mr-3 rounded-full overflow-hidden border">
                        <img
                          src={restaurant.logo_url}
                          alt={`${restaurant.name} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100/orange/white?text=R';
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(restaurant.status)}>
                    {restaurant.status === 'pending_verification' ? 'Pending' :
                     restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <span>{formatLocation(restaurant)}</span>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <span>
                      {getWorkingHours(restaurant.id) ?
                        "Working hours available" :
                        "No working hours specified"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BasicRestaurantsPage;

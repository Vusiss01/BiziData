import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddRestaurantForm from "@/components/restaurants/AddRestaurantForm";
import { getSupabaseClient } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface Restaurant {
  id: string;
  name: string;
  logo_url: string | null;
  cover_page_url: string | null;
  rating: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  // Additional fields from joins
  location?: string;
}

const RestaurantsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to avoid initial loading state
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  console.log("RestaurantsPage - Component rendered");

  // Fetch restaurants from Supabase
  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching restaurants...");

      // Get restaurants with their primary location
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          id,
          name,
          logo_url,
          cover_page_url,
          rating,
          status,
          created_at,
          updated_at,
          owner_id,
          restaurant_locations (suburb)
        `);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Restaurants data:", data);

      // If no data, set empty array
      if (!data || data.length === 0) {
        console.log("No restaurants found");
        setRestaurants([]);
        return;
      }

      // Process the data to include location information
      const processedData = data.map((restaurant: any) => {
        let location = "";
        if (restaurant.restaurant_locations && restaurant.restaurant_locations.length > 0) {
          location = restaurant.restaurant_locations[0].suburb;
        }
        return {
          ...restaurant,
          location,
        };
      });

      setRestaurants(processedData);
    } catch (error: any) {
      console.error("Error fetching restaurants:", error);
      setError(error.message || "Failed to load restaurants");
      toast({
        title: "Error",
        description: `Failed to load restaurants: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      // Set empty array to avoid undefined errors
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Load restaurants on component mount
  useEffect(() => {
    console.log("RestaurantsPage - Fetching restaurants on mount");
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden">
          <AddRestaurantForm
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={fetchRestaurants}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search restaurants..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
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
      ) : filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No restaurants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{restaurant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span>{restaurant.location || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span>{restaurant.rating ? `${restaurant.rating}/5` : "Not rated"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={
                      restaurant.status === "active" ? "text-green-600" :
                      restaurant.status === "suspended" ? "text-red-600" : "text-amber-600"
                    }>
                      {restaurant.status === "active" ? "Active" :
                       restaurant.status === "suspended" ? "Suspended" : "Pending Verification"}
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

export default RestaurantsPage;

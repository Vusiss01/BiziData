import React, { useState, useEffect } from "react";
import { getSupabaseClient } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const SimpleRestaurantsPage = () => {
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  console.log("SimpleRestaurantsPage - Component rendered");

  // Fetch restaurants from Supabase
  const fetchRestaurants = async () => {
    console.log("SimpleRestaurantsPage - Starting to fetch restaurants");
    setLoading(true);
    setError(null);

    try {
      // Simple query to get restaurants
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, status");

      if (error) {
        console.error("SimpleRestaurantsPage - Supabase error:", error);
        throw error;
      }

      console.log("SimpleRestaurantsPage - Restaurants data:", data);
      setRestaurants(data || []);
    } catch (error: any) {
      console.error("SimpleRestaurantsPage - Error fetching restaurants:", error);
      setError(error.message || "Failed to load restaurants");
    } finally {
      console.log("SimpleRestaurantsPage - Fetch completed, setting loading to false");
      setLoading(false);
    }
  };

  // Load restaurants on component mount
  useEffect(() => {
    console.log("SimpleRestaurantsPage - Running useEffect");
    fetchRestaurants();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Simple Restaurants Page</h1>
      
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
          <button 
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md"
            onClick={fetchRestaurants}
          >
            Try Again
          </button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No restaurants found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="p-4 border rounded-md">
              <h2 className="font-medium">{restaurant.name}</h2>
              <p className="text-sm text-gray-500">Status: {restaurant.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleRestaurantsPage;

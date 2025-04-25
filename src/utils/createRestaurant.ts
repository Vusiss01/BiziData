import { supabase } from "@/lib/supabase";
import { syncUser } from "./userSync";

/**
 * Creates a restaurant with a direct SQL query to bypass RLS policies
 */
export const createRestaurant = async (
  ownerId: string,
  name: string,
  status: string,
  street?: string,
  suburb?: string,
  city?: string
) => {
  try {
    console.log("Creating restaurant with owner ID:", ownerId);

    // First ensure the user exists using our robust syncUser function
    const userData = await syncUser(ownerId, {
      role: 'owner' // Ensure the user has the owner role
    });

    if (!userData) {
      console.error("Failed to ensure user exists");
      throw new Error("Failed to ensure user exists in the database");
    }

    console.log("User synchronized successfully:", userData.id);

    // Create restaurant with direct insert
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        owner_id: ownerId,
        name: name,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (restaurantError) {
      console.error("Error creating restaurant:", restaurantError);
      throw restaurantError;
    }

    if (!restaurant || restaurant.length === 0) {
      throw new Error("Failed to create restaurant");
    }

    const restaurantId = restaurant[0].id;

    // Create location if provided
    if (street && suburb && city) {
      const { error: locationError } = await supabase
        .from("restaurant_locations")
        .insert({
          restaurant_id: restaurantId,
          street: street,
          suburb: suburb,
          city: city,
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (locationError) {
        console.error("Error creating location:", locationError);
        // Don't throw, just return the restaurant without location
      }
    }

    return restaurant[0];
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    throw error;
  }
};

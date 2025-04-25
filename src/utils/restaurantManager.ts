import { supabase } from "@/lib/supabase";
import { syncUser, UserData } from "./userSync";

/**
 * Restaurant data interface
 */
export interface RestaurantData {
  id?: string;
  owner_id: string;
  name: string;
  logo_url?: string | null;
  cover_page_url?: string | null;
  rating?: number | null;
  status: 'pending_verification' | 'active' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

/**
 * Restaurant location data interface
 */
export interface LocationData {
  id?: string;
  restaurant_id: string;
  street: string;
  suburb: string;
  city: string;
  town?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'open' | 'closed';
  rating?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Restaurant creation options
 */
export interface CreateRestaurantOptions {
  name: string;
  status?: 'pending_verification' | 'active' | 'suspended';
  logo_url?: string | null;
  cover_page_url?: string | null;
  location?: {
    street: string;
    suburb: string;
    city: string;
    town?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: 'open' | 'closed';
  };
}

/**
 * Creates a restaurant with proper validation and error handling
 *
 * @param ownerId - The ID of the restaurant owner
 * @param options - Restaurant creation options
 * @returns The created restaurant data with location if provided
 */
export const createRestaurant = async (
  ownerId: string,
  options: CreateRestaurantOptions
): Promise<{ restaurant: RestaurantData; location?: LocationData; owner: UserData }> => {
  console.log("Starting restaurant creation process...");

  // Validate required fields
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  if (!options.name || options.name.trim() === '') {
    throw new Error("Restaurant name is required");
  }

  // Set default values
  const status = options.status || 'pending_verification';
  const timestamp = new Date().toISOString();

  try {
    // Step 1: Ensure the owner exists and has the correct role
    console.log(`Ensuring owner with ID ${ownerId} exists...`);
    const owner = await syncUser(ownerId, { role: 'owner' });

    if (!owner) {
      throw new Error("Failed to ensure owner exists in the database");
    }

    console.log("Owner synchronized successfully:", owner.id);

    // Step 2: Begin a transaction for creating the restaurant and location
    console.log("Creating restaurant:", options.name);

    // Prepare restaurant data
    const restaurantData: RestaurantData = {
      owner_id: ownerId,
      name: options.name.trim(),
      logo_url: options.logo_url || null,
      cover_page_url: options.cover_page_url || null,
      status: status,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Insert restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert(restaurantData)
      .select()
      .single();

    if (restaurantError) {
      console.error("Error creating restaurant:", restaurantError);

      // Provide more specific error messages based on error code
      if (restaurantError.code === '23503') {
        throw new Error("Foreign key violation - the owner may not exist in the database");
      } else if (restaurantError.code === '23505') {
        throw new Error("A restaurant with this name may already exist");
      } else if (restaurantError.code === '42501') {
        throw new Error("Permission denied - you may not have the right permissions to create restaurants");
      } else {
        throw restaurantError;
      }
    }

    if (!restaurant) {
      throw new Error("Failed to create restaurant - no data returned");
    }

    console.log("Restaurant created successfully:", restaurant.id);

    // Step 3: Create location if provided
    let location: LocationData | undefined;

    if (options.location) {
      console.log("Creating restaurant location...");

      // Validate location data
      if (!options.location.street || !options.location.suburb || !options.location.city) {
        console.warn("Incomplete location data provided, skipping location creation");
      } else {
        // Prepare location data
        const locationPayload: LocationData = {
          restaurant_id: restaurant.id,
          street: options.location.street.trim(),
          suburb: options.location.suburb.trim(),
          city: options.location.city.trim(),
          town: options.location.town || null,
          latitude: options.location.latitude || null,
          longitude: options.location.longitude || null,
          status: options.location.status || 'open',
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Insert location
        const { data: locationResult, error: locationError } = await supabase
          .from("restaurant_locations")
          .insert(locationPayload)
          .select()
          .single();

        if (locationError) {
          console.error("Error creating restaurant location:", locationError);
          // We don't throw here because the restaurant was created successfully
          // Instead, we return the restaurant without the location
        } else if (locationResult) {
          location = locationResult;
          console.log("Restaurant location created successfully:", location.id);
        }
      }
    }

    // Return the created restaurant and location
    return {
      restaurant,
      location,
      owner
    };
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    throw error;
  }
};

/**
 * Gets a restaurant by ID with its locations
 *
 * @param restaurantId - The ID of the restaurant to get
 * @returns The restaurant data with its locations
 */
export const getRestaurant = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select(`
        *,
        restaurant_locations (*)
      `)
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("Error getting restaurant:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getRestaurant:", error);
    throw error;
  }
};

/**
 * Gets all restaurants with optional filtering
 *
 * @param options - Filter options
 * @returns Array of restaurants with their locations
 */
export const getRestaurants = async (options?: {
  ownerId?: string;
  status?: 'pending_verification' | 'active' | 'suspended';
  limit?: number;
}) => {
  try {
    let query = supabase
      .from("restaurants")
      .select(`
        *,
        restaurant_locations (*)
      `);

    // Apply filters
    if (options?.ownerId) {
      query = query.eq("owner_id", options.ownerId);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Order by created_at
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error getting restaurants:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRestaurants:", error);
    throw error;
  }
};

/**
 * Updates a restaurant
 *
 * @param restaurantId - The ID of the restaurant to update
 * @param updates - The updates to apply
 * @returns The updated restaurant data
 */
export const updateRestaurant = async (
  restaurantId: string,
  updates: Partial<Omit<RestaurantData, 'id' | 'owner_id' | 'created_at'>>
) => {
  try {
    // Validate restaurant ID
    if (!restaurantId) {
      throw new Error("Restaurant ID is required");
    }

    // Add updated_at timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("restaurants")
      .update(updatedData)
      .eq("id", restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating restaurant:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateRestaurant:", error);
    throw error;
  }
};

/**
 * Updates a restaurant location
 *
 * @param locationId - The ID of the location to update
 * @param updates - The updates to apply
 * @returns The updated location data
 */
export const updateLocation = async (
  locationId: string,
  updates: Partial<Omit<LocationData, 'id' | 'restaurant_id' | 'created_at'>>
) => {
  try {
    // Validate location ID
    if (!locationId) {
      throw new Error("Location ID is required");
    }

    // Add updated_at timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("restaurant_locations")
      .update(updatedData)
      .eq("id", locationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating restaurant location:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateLocation:", error);
    throw error;
  }
};

import { supabase } from "@/lib/supabase";
import { syncUser } from "@/utils/userSync";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";
import { fetchData, fetchById, insertRecord, updateRecord, deleteRecord } from "@/utils/dataUtils";

/**
 * Restaurant data interface
 */
export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  logo_url?: string | null;
  cover_page_url?: string | null;
  rating?: number | null;
  status: 'pending_verification' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

/**
 * Restaurant location data interface
 */
export interface RestaurantLocation {
  id: string;
  restaurant_id: string;
  street: string;
  suburb: string;
  city: string;
  town?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'open' | 'closed';
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Restaurant with locations
 */
export interface RestaurantWithLocations extends Restaurant {
  restaurant_locations: RestaurantLocation[];
}

/**
 * Working hours for a day
 */
export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

/**
 * Restaurant creation options
 */
export interface CreateRestaurantOptions {
  name: string;
  owner_id?: string;
  status?: 'pending_verification' | 'active' | 'suspended';
  logo_url?: string | null;
  cover_page_url?: string | null;
  working_hours?: WorkingHours[];
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
 * Restaurant update options
 */
export interface UpdateRestaurantOptions {
  name?: string;
  status?: 'pending_verification' | 'active' | 'suspended';
  logo_url?: string | null;
  cover_page_url?: string | null;
}

/**
 * Restaurant location update options
 */
export interface UpdateLocationOptions {
  street?: string;
  suburb?: string;
  city?: string;
  town?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'open' | 'closed';
}

/**
 * Restaurant filter options
 */
export interface RestaurantFilterOptions {
  owner_id?: string;
  status?: string | string[];
  search?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Get all restaurants with optional filtering
 */
export async function getRestaurants(options: RestaurantFilterOptions = {}) {
  try {
    const {
      owner_id,
      status,
      search,
      limit,
      page,
      pageSize = 10,
      orderBy = 'created_at',
      orderDirection = 'desc',
    } = options;

    // Build filters
    const filters: Record<string, any> = {};

    if (owner_id) {
      filters.owner_id = owner_id;
    }

    if (status) {
      filters.status = status;
    }

    // Build fetch options
    const fetchOptions = {
      select: `
        *,
        restaurant_locations (*)
      `,
      filters,
      order: {
        column: orderBy,
        ascending: orderDirection === 'asc',
      },
      limit,
      page,
      pageSize,
    };

    // Handle search separately
    if (search) {
      // Use custom query for search
      let query = supabase
        .from('restaurants')
        .select(fetchOptions.select, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply search
      query = query.or(`name.ilike.%${search}%`);

      // Apply sorting
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (page !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count, error: null };
    }

    // Use generic fetch for non-search queries
    return await fetchData<RestaurantWithLocations>('restaurants', fetchOptions);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getRestaurants',
        options,
      },
    });

    return { data: [], count: 0, error };
  }
}

/**
 * Get a restaurant by ID
 */
export async function getRestaurantById(id: string) {
  try {
    return await fetchById<RestaurantWithLocations>(
      'restaurants',
      id,
      `
        *,
        restaurant_locations (*)
      `
    );
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getRestaurantById',
        id,
      },
    });

    return { data: null, error };
  }
}

/**
 * Create a restaurant
 */
export async function createRestaurant(
  ownerId: string,
  options: CreateRestaurantOptions
) {
  try {
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

    // Step 1: Ensure the owner exists and has the correct role
    console.log(`Ensuring owner with ID ${ownerId} exists...`);
    const owner = await syncUser(ownerId, { role: 'owner' });

    if (!owner) {
      throw new Error("Failed to ensure owner exists in the database");
    }

    // Step 2: Create the restaurant
    const restaurantData = {
      owner_id: ownerId,
      name: options.name.trim(),
      logo_url: options.logo_url || null,
      cover_page_url: options.cover_page_url || null,
      status: status,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { data: restaurant, error: restaurantError } = await insertRecord<Restaurant>(
      'restaurants',
      restaurantData
    );

    if (restaurantError || !restaurant) {
      throw restaurantError || new Error("Failed to create restaurant");
    }

    // Step 3: Create location if provided
    let location: RestaurantLocation | null = null;

    if (options.location) {
      // Validate location data
      if (!options.location.street || !options.location.suburb || !options.location.city) {
        console.warn("Incomplete location data provided, skipping location creation");
      } else {
        // Prepare location data
        const locationData = {
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

        const { data: locationResult, error: locationError } = await insertRecord<RestaurantLocation>(
          'restaurant_locations',
          locationData
        );

        if (locationError) {
          console.error("Error creating restaurant location:", locationError);
          // We don't throw here because the restaurant was created successfully
        } else if (locationResult) {
          location = locationResult;
        }
      }
    }

    // Step 4: Create working hours if provided
    let workingHours = [];

    if (options.working_hours && options.working_hours.length > 0) {
      try {
        // Check if restaurant_working_hours table exists
        const { error: tableCheckError } = await supabase
          .from('restaurant_working_hours')
          .select('id')
          .limit(1);

        if (tableCheckError) {
          console.warn("restaurant_working_hours table may not exist, skipping working hours creation");
        } else {
          // Insert working hours
          for (const hours of options.working_hours) {
            const workingHoursData = {
              restaurant_id: restaurant.id,
              day: hours.day,
              open_time: hours.open_time,
              close_time: hours.close_time,
              is_closed: hours.is_closed,
              created_at: timestamp,
              updated_at: timestamp,
            };

            const { data: hoursResult, error: hoursError } = await supabase
              .from('restaurant_working_hours')
              .insert(workingHoursData)
              .select();

            if (hoursError) {
              console.error(`Error creating working hours for ${hours.day}:`, hoursError);
            } else if (hoursResult) {
              workingHours.push(hoursResult[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error creating working hours:", error);
        // We don't throw here because the restaurant was created successfully
      }
    }

    // Return the created restaurant with location and working hours
    return {
      restaurant,
      location,
      owner,
      workingHours: workingHours.length > 0 ? workingHours : null,
      error: null,
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'createRestaurant',
        ownerId,
        options,
      },
    });

    return {
      restaurant: null,
      location: null,
      owner: null,
      error,
    };
  }
}

/**
 * Update a restaurant
 */
export async function updateRestaurant(
  id: string,
  options: UpdateRestaurantOptions
) {
  try {
    // Validate ID
    if (!id) {
      throw new Error("Restaurant ID is required");
    }

    // Prepare update data
    const updateData = {
      ...options,
      updated_at: new Date().toISOString(),
    };

    // Update restaurant
    return await updateRecord<Restaurant>('restaurants', id, updateData);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'updateRestaurant',
        id,
        options,
      },
    });

    return { data: null, error };
  }
}

/**
 * Update a restaurant location
 */
export async function updateRestaurantLocation(
  id: string,
  options: UpdateLocationOptions
) {
  try {
    // Validate ID
    if (!id) {
      throw new Error("Location ID is required");
    }

    // Prepare update data
    const updateData = {
      ...options,
      updated_at: new Date().toISOString(),
    };

    // Update location
    return await updateRecord<RestaurantLocation>('restaurant_locations', id, updateData);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'updateRestaurantLocation',
        id,
        options,
      },
    });

    return { data: null, error };
  }
}

/**
 * Delete a restaurant
 */
export async function deleteRestaurant(id: string) {
  try {
    // Validate ID
    if (!id) {
      throw new Error("Restaurant ID is required");
    }

    // First delete all locations
    const { data: locations } = await supabase
      .from('restaurant_locations')
      .select('id')
      .eq('restaurant_id', id);

    if (locations && locations.length > 0) {
      for (const location of locations) {
        await deleteRecord('restaurant_locations', location.id);
      }
    }

    // Then delete the restaurant
    return await deleteRecord('restaurants', id);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'deleteRestaurant',
        id,
      },
    });

    return { success: false, error };
  }
}

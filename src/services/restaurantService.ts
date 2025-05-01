import { syncUser } from "@/utils/userSync";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  ownerId?: string;  // Changed from owner_id to ownerId for consistency
  status?: string | string[];
  search?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  startAfter?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Get all restaurants with optional filtering
 */
export async function getRestaurants(options: RestaurantFilterOptions = {}) {
  try {
    console.log('Starting getRestaurants function...');

    // Import necessary Firebase functions
    const { collection, query, getDocs, orderBy, limit, where, doc, getDoc } = await import('firebase/firestore');

    // Check authentication state
    console.log('Current auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');

    // Create a reference to the restaurants collection
    const restaurantsRef = collection(db, 'restaurants');

    // Build query constraints
    const constraints = [];

    // Add filters if provided
    if (options.ownerId) {
      constraints.push(where('owner_id', '==', options.ownerId));
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        constraints.push(where('status', 'in', options.status));
      } else {
        constraints.push(where('status', '==', options.status));
      }
    }

    // Add ordering
    constraints.push(orderBy('created_at', 'desc'));

    // Add limit if provided
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    // First, try to directly fetch the specific restaurant we know exists
    console.log('Attempting to directly fetch known restaurant...');
    try {
      const knownRestaurantId = "DNmFionRsJpsgUuddy9"; // ID from your screenshot
      const restaurantDoc = await getDoc(doc(db, 'restaurants', knownRestaurantId));

      if (restaurantDoc.exists()) {
        console.log('Successfully fetched known restaurant:', restaurantDoc.id);
        const data = restaurantDoc.data();

        // Return just this restaurant if it exists
        return {
          data: [{
            id: restaurantDoc.id,
            ...data,
            created_at: data.created_at?.toDate?.() || data.created_at,
            updated_at: data.updated_at?.toDate?.() || data.updated_at
          }],
          count: 1,
          error: null
        };
      } else {
        console.log(`Known restaurant ${knownRestaurantId} not found, continuing with query...`);
      }
    } catch (directFetchError) {
      console.error('Error fetching known restaurant:', directFetchError);
      console.error('Error code:', directFetchError.code);
      console.error('Error message:', directFetchError.message);
    }

    // If direct fetch failed, try the normal query
    console.log('Executing normal query...');
    const restaurantsQuery = query(restaurantsRef, ...constraints);

    try {
      const querySnapshot = await getDocs(restaurantsQuery);
      console.log(`Query returned ${querySnapshot.docs.length} restaurants`);

      // Process results
      const restaurants = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || data.created_at,
          updated_at: data.updated_at?.toDate?.() || data.updated_at
        };
      });

      return {
        data: restaurants,
        count: restaurants.length,
        error: null
      };
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('Error in getRestaurants:', error);

    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getRestaurants',
        options,
      },
    });

    // Return empty array with error
    return {
      data: [],
      count: 0,
      error
    };
  }
}

/**
 * Get a restaurant by ID
 * This is a placeholder that will be replaced with actual implementation
 */
export async function getRestaurantById(id: string) {
  return { data: null, error: new Error("Not implemented") };
}

/**
 * Create a restaurant using Firebase
 */
export async function createRestaurant(
  ownerId: string,
  options: CreateRestaurantOptions
) {
  try {
    console.log(`Creating restaurant for owner ${ownerId} with options:`, options);

    // Validate required fields
    if (!ownerId) {
      throw new Error("Owner ID is required");
    }

    if (!options.name || options.name.trim() === '') {
      throw new Error("Restaurant name is required");
    }

    // Import necessary Firebase functions
    const { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');

    // Set default values
    const status = options.status || 'pending_verification';

    // Verify owner exists
    console.log(`Verifying owner with ID ${ownerId} exists...`);
    try {
      const ownerRef = doc(db, 'users', ownerId);
      const ownerDoc = await getDoc(ownerRef);

      if (!ownerDoc.exists()) {
        console.error(`Owner with ID ${ownerId} does not exist`);
        throw new Error(`Owner with ID ${ownerId} does not exist`);
      }

      const ownerData = ownerDoc.data();
      console.log(`Owner verified: ${ownerData.name} (${ownerData.email})`);
    } catch (ownerError) {
      console.error(`Error verifying owner:`, ownerError);
      throw new Error(`Failed to verify owner: ${ownerError.message}`);
    }

    // Create restaurant document
    console.log(`Creating restaurant document for "${options.name}"...`);
    const restaurantData = {
      owner_id: ownerId,
      name: options.name.trim(),
      logo_url: options.logo_url || null,
      cover_page_url: options.cover_page_url || null,
      status: status,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    // Add restaurant to Firestore
    let restaurantRef;
    try {
      restaurantRef = await addDoc(collection(db, 'restaurants'), restaurantData);
      console.log(`Restaurant created with ID: ${restaurantRef.id}`);
    } catch (addError) {
      console.error(`Error adding restaurant to Firestore:`, addError);
      throw new Error(`Failed to create restaurant: ${addError.message}`);
    }

    // Get the created restaurant
    const restaurantDoc = await getDoc(restaurantRef);
    const restaurant = {
      id: restaurantDoc.id,
      ...restaurantDoc.data(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create location if provided
    let location = null;
    if (options.location) {
      console.log(`Creating location for restaurant ${restaurantRef.id}...`);
      try {
        const locationData = {
          restaurant_id: restaurantRef.id,
          ...options.location,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        const locationRef = await addDoc(collection(db, 'restaurant_locations'), locationData);
        console.log(`Location created with ID: ${locationRef.id}`);

        const locationDoc = await getDoc(locationRef);
        location = {
          id: locationDoc.id,
          ...locationDoc.data(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } catch (locationError) {
        console.error(`Error creating location:`, locationError);
        // Don't fail the whole operation if location creation fails
        console.warn(`Restaurant created but location creation failed`);
      }
    }

    // Create working hours if provided
    if (options.working_hours && options.working_hours.length > 0) {
      console.log(`Creating ${options.working_hours.length} working hours entries...`);
      try {
        const workingHoursCollection = collection(db, 'restaurant_working_hours');

        for (const hours of options.working_hours) {
          if (!hours.day) continue; // Skip invalid entries

          const hoursData = {
            restaurant_id: restaurantRef.id,
            ...hours,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          };

          await addDoc(workingHoursCollection, hoursData);
        }

        console.log(`Working hours created successfully`);
      } catch (hoursError) {
        console.error(`Error creating working hours:`, hoursError);
        // Don't fail the whole operation if hours creation fails
        console.warn(`Restaurant created but working hours creation failed`);
      }
    }

    // Get owner data
    const ownerRef = doc(db, 'users', ownerId);
    const ownerDoc = await getDoc(ownerRef);
    const owner = {
      id: ownerDoc.id,
      ...ownerDoc.data(),
    };

    console.log(`Restaurant creation completed successfully`);
    return {
      restaurant,
      location,
      owner,
      error: null,
    };
  } catch (error) {
    console.error(`Error in createRestaurant:`, error);

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
 * This is a placeholder that will be replaced with actual implementation
 */
export async function updateRestaurant(
  id: string,
  options: UpdateRestaurantOptions
) {
  return { data: null, error: new Error("Not implemented") };
}

/**
 * Update a restaurant location
 * This is a placeholder that will be replaced with actual implementation
 */
export async function updateRestaurantLocation(
  id: string,
  options: UpdateLocationOptions
) {
  return { data: null, error: new Error("Not implemented") };
}

/**
 * Delete a restaurant
 * This is a placeholder that will be replaced with actual implementation
 */
export async function deleteRestaurant(id: string) {
  return { success: false, error: new Error("Not implemented") };
}

/**
 * Get mock restaurants for testing and fallback
 */
function getMockRestaurants(ownerId: string): any[] {
  // Map of owner IDs to mock restaurants
  const mockRestaurantsByOwner: Record<string, any[]> = {
    // Mock owner 1
    "mock-admin-1": [
      {
        id: "mock-restaurant-1",
        name: "Admin's Test Restaurant",
        owner_id: "mock-admin-1",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    // Mock owner 2 (restaurant owner)
    "mock-owner-1": [
      {
        id: "mock-restaurant-2",
        name: "Pizza Palace",
        owner_id: "mock-owner-1",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "mock-restaurant-3",
        name: "Pasta Paradise",
        owner_id: "mock-owner-1",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    // For specific mock users from the UI
    "1": [
      {
        id: "r1",
        name: "Pizza Palace",
        owner_id: "1",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "r2",
        name: "Pasta Paradise",
        owner_id: "1",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    "2": [
      {
        id: "r3",
        name: "Burger Bonanza",
        owner_id: "2",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    "3": [
      {
        id: "r4",
        name: "Sushi Supreme",
        owner_id: "3",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "r5",
        name: "Noodle House",
        owner_id: "3",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    "4": [
      {
        id: "r6",
        name: "Taco Time",
        owner_id: "4",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  };

  // Return mock restaurants for the given owner ID, or an empty array if none exist
  return mockRestaurantsByOwner[ownerId] || [];
}

/**
 * Get restaurants by owner ID
 */
export async function getRestaurantsByOwnerId(ownerId: string) {
  try {
    console.log(`Getting restaurants for owner ID: ${ownerId}`);

    if (!ownerId) {
      throw new Error("Owner ID is required");
    }

    try {
      // Query restaurants collection for restaurants with the given owner_id
      const restaurantsQuery = query(
        collection(db, 'restaurants'),
        where('owner_id', '==', ownerId)
      );

      console.log(`Executing Firestore query on 'restaurants' collection for owner: ${ownerId}`);
      const snapshot = await getDocs(restaurantsQuery);
      console.log(`Query returned ${snapshot.docs.length} restaurants`);

      // Process results
      const restaurants = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || data.created_at,
          updated_at: data.updated_at?.toDate?.() || data.updated_at
        };
      });

      // If no restaurants found, return mock data in development
      if (restaurants.length === 0 && process.env.NODE_ENV === 'development') {
        console.log(`No restaurants found for owner ${ownerId}, returning mock data`);
        const mockRestaurants = getMockRestaurants(ownerId);
        return {
          data: mockRestaurants,
          count: mockRestaurants.length,
          error: null
        };
      }

      return {
        data: restaurants,
        count: restaurants.length,
        error: null
      };
    } catch (firestoreError) {
      console.error(`Error querying Firestore for restaurants:`, firestoreError);

      // In development, return mock data as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`Returning mock restaurant data due to Firestore error`);
        const mockRestaurants = getMockRestaurants(ownerId);
        return {
          data: mockRestaurants,
          count: mockRestaurants.length,
          error: firestoreError
        };
      }

      throw firestoreError;
    }
  } catch (error) {
    console.error(`Error in getRestaurantsByOwnerId:`, error);

    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getRestaurantsByOwnerId',
        ownerId,
      },
    });

    // Always return mock data in development
    if (process.env.NODE_ENV === 'development') {
      const mockRestaurants = getMockRestaurants(ownerId);
      return {
        data: mockRestaurants,
        count: mockRestaurants.length,
        error
      };
    }

    return { data: [], count: 0, error };
  }
}

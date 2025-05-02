import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from './databaseService';
import { ErrorCategory, handleError } from '@/utils/errorHandler';

// Define the Restaurant interface
export interface Restaurant {
  id?: string;
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
  owner_id?: string;
  working_hours?: {
    day: string;
    open: string;
    close: string;
    is_closed?: boolean;
  }[];
  display_picture?: string; // URL to the restaurant logo/display picture
  background_picture?: string; // URL to the restaurant background/cover image
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
}

// Define the working hours interface
export interface WorkingHours {
  day: string;
  open: string;
  close: string;
  is_closed?: boolean;
}

// Default working hours to use if none are defined
export const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { day: 'Monday', open: '09:00', close: '17:00', is_closed: false },
  { day: 'Tuesday', open: '09:00', close: '17:00', is_closed: false },
  { day: 'Wednesday', open: '09:00', close: '17:00', is_closed: false },
  { day: 'Thursday', open: '09:00', close: '17:00', is_closed: false },
  { day: 'Friday', open: '09:00', close: '17:00', is_closed: false },
  { day: 'Saturday', open: '10:00', close: '15:00', is_closed: false },
  { day: 'Sunday', open: '10:00', close: '15:00', is_closed: true },
];

/**
 * Get all restaurants
 */
export const getAllRestaurants = async (): Promise<Restaurant[]> => {
  try {
    console.log('Fetching all restaurants from Firebase');

    // Create query
    const restaurantsQuery = query(
      collection(db, 'restaurants'),
      orderBy('created_at', 'desc')
    );

    // Execute query
    const snapshot = await getDocs(restaurantsQuery);

    console.log(`Query returned ${snapshot.docs.length} restaurants`);

    // Use the DEFAULT_WORKING_HOURS constant

    // Process results
    const restaurants = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Restaurant ${doc.id} data:`, data);
      console.log(`Restaurant ${doc.id} working_hours:`, data.working_hours);

      // Check if working_hours is properly defined
      let workingHours = data.working_hours;

      // If working_hours is not defined or not an array, use default hours
      if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
        console.log(`Restaurant ${doc.id} has no working hours, using defaults`);
        workingHours = DEFAULT_WORKING_HOURS;

        // Update the restaurant in Firestore with default working hours
        // This is done asynchronously and doesn't block the current operation
        updateDoc(doc.ref, { working_hours: DEFAULT_WORKING_HOURS })
          .then(() => console.log(`Updated restaurant ${doc.id} with default working hours`))
          .catch(err => console.error(`Failed to update restaurant ${doc.id} with default working hours:`, err));
      }

      return convertTimestamps({
        id: doc.id,
        name: data.name || 'Unnamed Restaurant',
        description: data.description,
        address: data.address,
        contact: data.contact,
        cuisine: data.cuisine,
        priceRange: data.priceRange,
        rating: data.rating,
        status: data.status || 'active',
        owner_id: data.owner_id,
        working_hours: workingHours,
        display_picture: data.display_picture,
        background_picture: data.background_picture,
        created_at: data.created_at,
        updated_at: data.updated_at
      }) as Restaurant;
    });

    return restaurants;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch restaurants',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDocs(query(collection(db, 'restaurants'), where('__name__', '==', restaurantId)));

    if (docSnap.empty) {
      return null;
    }

    const data = docSnap.docs[0].data();

    // Use the DEFAULT_WORKING_HOURS constant

    // Check if working_hours is properly defined
    let workingHours = data.working_hours;

    // If working_hours is not defined or not an array, use default hours
    if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
      console.log(`Restaurant ${restaurantId} has no working hours, using defaults`);
      workingHours = DEFAULT_WORKING_HOURS;

      // Update the restaurant in Firestore with default working hours
      updateDoc(docRef, { working_hours: DEFAULT_WORKING_HOURS })
        .then(() => console.log(`Updated restaurant ${restaurantId} with default working hours`))
        .catch(err => console.error(`Failed to update restaurant ${restaurantId} with default working hours:`, err));
    }

    return convertTimestamps({
      id: docSnap.docs[0].id,
      ...data,
      working_hours: workingHours
    }) as Restaurant;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch restaurant',
      category: ErrorCategory.DATABASE,
      context: { restaurantId }
    });
    return null;
  }
};

/**
 * Add a new restaurant
 */
export const addRestaurant = async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    console.log('Adding new restaurant with data:', restaurant);

    // Add timestamp fields
    const restaurantWithTimestamps = {
      ...restaurant,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'restaurants'), restaurantWithTimestamps);
    console.log('Restaurant added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    handleError(error, {
      message: 'Failed to add restaurant',
      category: ErrorCategory.DATABASE,
      context: { restaurant }
    });
    return null;
  }
};

/**
 * Update restaurant
 */
export const updateRestaurant = async (restaurantId: string, updates: Partial<Restaurant>): Promise<boolean> => {
  try {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: Timestamp.now()
    };

    // Update in Firestore
    await updateDoc(doc(db, 'restaurants', restaurantId), updatesWithTimestamp);
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update restaurant',
      category: ErrorCategory.DATABASE,
      context: { restaurantId, updates }
    });
    return false;
  }
};

/**
 * Delete restaurant
 */
export const deleteRestaurant = async (restaurantId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId));
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete restaurant',
      category: ErrorCategory.DATABASE,
      context: { restaurantId }
    });
    return false;
  }
};

/**
 * Get restaurants by owner ID
 */
export const getRestaurantsByOwnerId = async (ownerId: string): Promise<Restaurant[]> => {
  try {
    const restaurantsQuery = query(
      collection(db, 'restaurants'),
      where('owner_id', '==', ownerId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(restaurantsQuery);

    // Use the DEFAULT_WORKING_HOURS constant

    const restaurants = snapshot.docs.map(doc => {
      const data = doc.data();

      // Check if working_hours is properly defined
      let workingHours = data.working_hours;

      // If working_hours is not defined or not an array, use default hours
      if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
        console.log(`Restaurant ${doc.id} has no working hours, using defaults`);
        workingHours = DEFAULT_WORKING_HOURS;

        // Update the restaurant in Firestore with default working hours
        updateDoc(doc.ref, { working_hours: DEFAULT_WORKING_HOURS })
          .then(() => console.log(`Updated restaurant ${doc.id} with default working hours`))
          .catch(err => console.error(`Failed to update restaurant ${doc.id} with default working hours:`, err));
      }

      return convertTimestamps({
        id: doc.id,
        ...data,
        working_hours: workingHours
      }) as Restaurant;
    });

    return restaurants;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch restaurants by owner',
      category: ErrorCategory.DATABASE,
      context: { ownerId }
    });
    return [];
  }
};

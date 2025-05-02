import { collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from './databaseService';
import { ErrorCategory, handleError } from '@/utils/errorHandler';

export interface TrackingEvent {
  id?: string;
  type: 'location_update' | 'status_change' | 'order_assigned' | 'order_delivered';
  driver: {
    id: string;
    name: string;
    avatar?: string;
  };
  order?: {
    id: string;
    restaurant: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status?: string;
  timestamp: Date | Timestamp;
}

export interface DriverLocation {
  id?: string;
  driver_id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: string;
  lastUpdated: Date | Timestamp;
  vehicle: string;
  currentOrder?: string;
}

/**
 * Get recent tracking events
 */
export const getRecentTrackingEvents = async (limit = 20): Promise<TrackingEvent[]> => {
  try {
    const eventsQuery = query(
      collection(db, 'tracking_events'),
      orderBy('timestamp', 'desc'),
      limit
    );
    
    const snapshot = await getDocs(eventsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        ...data
      }) as TrackingEvent;
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch tracking events',
      category: ErrorCategory.DATABASE,
      context: { limit }
    });
    return [];
  }
};

/**
 * Get active driver locations
 */
export const getActiveDriverLocations = async (): Promise<DriverLocation[]> => {
  try {
    const locationsQuery = query(
      collection(db, 'driver_locations'),
      where('status', '!=', 'offline')
    );
    
    const snapshot = await getDocs(locationsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        ...data
      }) as DriverLocation;
    });
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch driver locations',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Subscribe to tracking events in real-time
 */
export const subscribeToTrackingEvents = (
  callback: (events: TrackingEvent[]) => void,
  limitCount = 20
) => {
  const eventsQuery = query(
    collection(db, 'tracking_events'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data
        }) as TrackingEvent;
      });
      
      callback(events);
    },
    (error) => {
      handleError(error, {
        message: 'Error in tracking events subscription',
        category: ErrorCategory.DATABASE,
        context: { limitCount }
      });
      callback([]);
    }
  );
};

/**
 * Subscribe to driver locations in real-time
 */
export const subscribeToDriverLocations = (
  callback: (locations: DriverLocation[]) => void
) => {
  const locationsQuery = query(
    collection(db, 'driver_locations'),
    where('status', '!=', 'offline')
  );
  
  return onSnapshot(
    locationsQuery,
    (snapshot) => {
      const locations = snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data
        }) as DriverLocation;
      });
      
      callback(locations);
    },
    (error) => {
      handleError(error, {
        message: 'Error in driver locations subscription',
        category: ErrorCategory.DATABASE
      });
      callback([]);
    }
  );
};

/**
 * Add a new tracking event
 */
export const addTrackingEvent = async (event: Omit<TrackingEvent, 'id'>): Promise<string | null> => {
  try {
    // Ensure timestamp is a Firestore Timestamp
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp instanceof Date 
        ? Timestamp.fromDate(event.timestamp) 
        : event.timestamp
    };
    
    const docRef = await addDoc(collection(db, 'tracking_events'), eventWithTimestamp);
    return docRef.id;
  } catch (error) {
    handleError(error, {
      message: 'Failed to add tracking event',
      category: ErrorCategory.DATABASE,
      context: { event }
    });
    return null;
  }
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (
  driverId: string, 
  location: {
    latitude: number;
    longitude: number;
    address: string;
  },
  status?: string
): Promise<boolean> => {
  try {
    // First check if driver location document exists
    const locationsQuery = query(
      collection(db, 'driver_locations'),
      where('driver_id', '==', driverId),
      limit(1)
    );
    
    const snapshot = await getDocs(locationsQuery);
    
    if (snapshot.empty) {
      // Create new driver location document
      await addDoc(collection(db, 'driver_locations'), {
        driver_id: driverId,
        location,
        status: status || 'available',
        lastUpdated: Timestamp.now()
      });
    } else {
      // Update existing driver location document
      const locationDoc = snapshot.docs[0];
      const updateData: any = {
        location,
        lastUpdated: Timestamp.now()
      };
      
      if (status) {
        updateData.status = status;
      }
      
      await updateDoc(doc(db, 'driver_locations', locationDoc.id), updateData);
    }
    
    // Also add a tracking event
    await addTrackingEvent({
      type: 'location_update',
      driver: {
        id: driverId,
        name: 'Driver' // This should be fetched from user data in a real app
      },
      location,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update driver location',
      category: ErrorCategory.DATABASE,
      context: { driverId, location, status }
    });
    return false;
  }
};

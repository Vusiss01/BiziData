import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from './databaseService';
import { ErrorCategory, handleError } from '@/utils/errorHandler';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Driver {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'driver';
  is_verified: boolean;
  current_suburb?: string;
  rating?: number;
  completed_orders?: number;
  vehicle_type?: string;
  avatar_url?: string;
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
}

export interface DriverDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  currentLocation: string;
  completedOrders: number;
  rating: number;
  vehicleType: string;
  avatarUrl?: string;
}

/**
 * Get all drivers
 */
export const getAllDrivers = async (): Promise<DriverDetails[]> => {
  try {
    // Create query for users with driver role
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      orderBy('created_at', 'desc')
    );
    
    // Execute query
    const snapshot = await getDocs(driversQuery);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Process driver data
    const drivers = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        name: data.name || 'Unknown Driver',
        email: data.email || '',
        phone: data.phone || 'No phone',
        status: data.is_verified ? 'active' : 'inactive',
        currentLocation: data.current_suburb || 'Unknown',
        completedOrders: data.completed_orders || 0,
        rating: data.rating || 0,
        vehicleType: data.vehicle_type || 'Car',
        avatarUrl: data.avatar_url
      }) as DriverDetails;
    });
    
    return drivers;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch drivers',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get driver by ID
 */
export const getDriverById = async (driverId: string): Promise<DriverDetails | null> => {
  try {
    const docRef = doc(db, 'users', driverId);
    const docSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', driverId)));
    
    if (docSnap.empty) {
      return null;
    }
    
    const data = docSnap.docs[0].data();
    
    if (data.role !== 'driver') {
      return null;
    }
    
    return convertTimestamps({
      id: docSnap.docs[0].id,
      name: data.name || 'Unknown Driver',
      email: data.email || '',
      phone: data.phone || 'No phone',
      status: data.is_verified ? 'active' : 'inactive',
      currentLocation: data.current_suburb || 'Unknown',
      completedOrders: data.completed_orders || 0,
      rating: data.rating || 0,
      vehicleType: data.vehicle_type || 'Car',
      avatarUrl: data.avatar_url
    }) as DriverDetails;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch driver',
      category: ErrorCategory.DATABASE,
      context: { driverId }
    });
    return null;
  }
};

/**
 * Add a new driver
 */
export const addDriver = async (driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    // Add timestamp fields
    const driverWithTimestamps = {
      ...driver,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'users'), driverWithTimestamps);
    return docRef.id;
  } catch (error) {
    handleError(error, {
      message: 'Failed to add driver',
      category: ErrorCategory.DATABASE,
      context: { driver }
    });
    return null;
  }
};

/**
 * Update driver
 */
export const updateDriver = async (driverId: string, updates: Partial<Driver>): Promise<boolean> => {
  try {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: Timestamp.now()
    };
    
    // Update in Firestore
    await updateDoc(doc(db, 'users', driverId), updatesWithTimestamp);
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update driver',
      category: ErrorCategory.DATABASE,
      context: { driverId, updates }
    });
    return false;
  }
};

/**
 * Delete driver
 */
export const deleteDriver = async (driverId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', driverId));
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete driver',
      category: ErrorCategory.DATABASE,
      context: { driverId }
    });
    return false;
  }
};

/**
 * Upload driver avatar
 */
export const uploadDriverAvatar = async (driverId: string, file: File): Promise<string | null> => {
  try {
    const storage = getStorage();
    const avatarRef = ref(storage, `profile-images/${driverId}/${file.name}`);
    
    // Upload file
    await uploadBytes(avatarRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(avatarRef);
    
    // Update driver with avatar URL
    await updateDriver(driverId, { avatar_url: downloadURL });
    
    return downloadURL;
  } catch (error) {
    handleError(error, {
      message: 'Failed to upload driver avatar',
      category: ErrorCategory.STORAGE,
      context: { driverId }
    });
    return null;
  }
};

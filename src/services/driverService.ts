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
  // Additional fields
  address?: string;
  license_number?: string;
  bio?: string;
  region_id?: string;
  display_name?: string;
  document_url?: string;
  document_type?: string;
  vehicle_image_url?: string;
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
  // Additional fields
  address?: string;
  licenseNumber?: string;
  bio?: string;
  regionId?: string;
  displayName?: string;
  licenseDocumentUrl?: string;
  vehicleImageUrl?: string;
}

/**
 * Get all drivers
 */
export const getAllDrivers = async (): Promise<DriverDetails[]> => {
  try {
    // Create query for users with driver role
    // Temporarily remove orderBy to avoid index issues
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );

    console.log('Fetching drivers with query:', driversQuery);

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
        avatarUrl: data.avatar_url,
        // Additional fields
        address: data.address,
        licenseNumber: data.license_number,
        bio: data.bio,
        regionId: data.region_id,
        displayName: data.display_name || data.name,
        licenseDocumentUrl: data.document_url,
        vehicleImageUrl: data.vehicle_image_url
      }) as DriverDetails;
    });

    return drivers;
  } catch (error) {
    console.error('Error fetching drivers:', error);
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
      avatarUrl: data.avatar_url,
      // Additional fields
      address: data.address,
      licenseNumber: data.license_number,
      bio: data.bio,
      regionId: data.region_id,
      displayName: data.display_name || data.name,
      licenseDocumentUrl: data.document_url,
      vehicleImageUrl: data.vehicle_image_url
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
    console.log('Adding new driver with data:', driver);

    // Add timestamp fields
    const driverWithTimestamps = {
      ...driver,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'users'), driverWithTimestamps);
    console.log('Driver added successfully with ID:', docRef.id);
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

/**
 * Upload driver document (license or vehicle image)
 * @param driverId The ID of the driver
 * @param file The file to upload
 * @param documentType The type of document ('license' or 'vehicle')
 * @returns The download URL of the uploaded file, or null if upload failed
 */
export const uploadDriverDocument = async (
  driverId: string,
  file: File,
  documentType: 'license' | 'vehicle'
): Promise<string | null> => {
  try {
    const storage = getStorage();
    const folderPath = documentType === 'license' ? 'driver-licenses' : 'vehicle-images';
    const docRef = ref(storage, `${folderPath}/${driverId}/${file.name}`);

    // Upload file
    await uploadBytes(docRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(docRef);

    return downloadURL;
  } catch (error) {
    handleError(error, {
      message: `Failed to upload driver ${documentType}`,
      category: ErrorCategory.STORAGE,
      context: { driverId, documentType }
    });
    return null;
  }
};

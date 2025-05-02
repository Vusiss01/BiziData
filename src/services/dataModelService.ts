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

// Define the DataModel interface
export interface DataModel {
  id?: string;
  name: string;
  description?: string;
  category: 'core' | 'extended';
  fields?: number;
  usageCount: number;
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
}

/**
 * Get all data models
 */
export const getAllDataModels = async (): Promise<DataModel[]> => {
  try {
    console.log('Fetching all data models from Firebase');

    // Create query
    const dataModelsQuery = query(
      collection(db, 'data_models'),
      orderBy('usageCount', 'desc')
    );

    // Execute query
    const snapshot = await getDocs(dataModelsQuery);

    console.log(`Query returned ${snapshot.docs.length} data models`);

    // Process results
    const dataModels = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        name: data.name || 'Unnamed Model',
        description: data.description,
        category: data.category || 'core',
        fields: data.fields || 0,
        usageCount: data.usageCount || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      }) as DataModel;
    });

    return dataModels;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch data models',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get popular data models
 */
export const getPopularDataModels = async (limitCount: number = 5): Promise<DataModel[]> => {
  try {
    console.log(`Fetching top ${limitCount} popular data models from Firebase`);

    // Create query
    const dataModelsQuery = query(
      collection(db, 'data_models'),
      orderBy('usageCount', 'desc'),
      limit(limitCount)
    );

    // Execute query
    const snapshot = await getDocs(dataModelsQuery);

    console.log(`Query returned ${snapshot.docs.length} popular data models`);

    // Process results
    const dataModels = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        name: data.name || 'Unnamed Model',
        description: data.description,
        category: data.category || 'core',
        fields: data.fields || 0,
        usageCount: data.usageCount || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      }) as DataModel;
    });

    return dataModels;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch popular data models',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get data model by ID
 */
export const getDataModelById = async (dataModelId: string): Promise<DataModel | null> => {
  try {
    const docRef = doc(db, 'data_models', dataModelId);
    const docSnap = await getDocs(query(collection(db, 'data_models'), where('__name__', '==', dataModelId)));

    if (docSnap.empty) {
      return null;
    }

    const data = docSnap.docs[0].data();
    return convertTimestamps({
      id: docSnap.docs[0].id,
      name: data.name || 'Unnamed Model',
      description: data.description,
      category: data.category || 'core',
      fields: data.fields || 0,
      usageCount: data.usageCount || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    }) as DataModel;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch data model',
      category: ErrorCategory.DATABASE,
      context: { dataModelId }
    });
    return null;
  }
};

/**
 * Add a new data model
 */
export const addDataModel = async (dataModel: Omit<DataModel, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    console.log('Adding new data model with data:', dataModel);

    // Add timestamp fields
    const dataModelWithTimestamps = {
      ...dataModel,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'data_models'), dataModelWithTimestamps);
    console.log('Data model added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    handleError(error, {
      message: 'Failed to add data model',
      category: ErrorCategory.DATABASE,
      context: { dataModel }
    });
    return null;
  }
};

/**
 * Update data model
 */
export const updateDataModel = async (dataModelId: string, updates: Partial<DataModel>): Promise<boolean> => {
  try {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: Timestamp.now()
    };

    // Update in Firestore
    await updateDoc(doc(db, 'data_models', dataModelId), updatesWithTimestamp);
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update data model',
      category: ErrorCategory.DATABASE,
      context: { dataModelId, updates }
    });
    return false;
  }
};

/**
 * Delete data model
 */
export const deleteDataModel = async (dataModelId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'data_models', dataModelId));
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to delete data model',
      category: ErrorCategory.DATABASE,
      context: { dataModelId }
    });
    return false;
  }
};

/**
 * Initialize default data models if none exist
 */
export const initializeDefaultDataModels = async (): Promise<boolean> => {
  try {
    // Check if we already have data models
    const dataModelsQuery = query(collection(db, 'data_models'), limit(1));
    const snapshot = await getDocs(dataModelsQuery);
    
    if (!snapshot.empty) {
      console.log('Data models already exist, skipping initialization');
      return true;
    }
    
    console.log('Initializing default data models');
    
    // Default data models
    const defaultDataModels = [
      {
        name: "Restaurant Profile",
        description: "Core restaurant information including name, address, hours, and contact details",
        category: "core",
        fields: 12,
        usageCount: 842
      },
      {
        name: "Menu Items",
        description: "Food and beverage items with prices, descriptions, categories, and images",
        category: "core",
        fields: 15,
        usageCount: 756
      },
      {
        name: "Order Management",
        description: "Customer orders with items, quantities, prices, and status tracking",
        category: "core",
        fields: 18,
        usageCount: 621
      },
      {
        name: "Customer Profiles",
        description: "Customer information including contact details, preferences, and order history",
        category: "extended",
        fields: 14,
        usageCount: 512
      },
      {
        name: "Delivery Tracking",
        description: "Real-time location tracking for delivery drivers and order status updates",
        category: "extended",
        fields: 10,
        usageCount: 498
      }
    ];
    
    // Add each data model
    for (const model of defaultDataModels) {
      await addDataModel(model);
    }
    
    console.log('Default data models initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize default data models',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Get count of data models
 */
export const getDataModelsCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(db, 'data_models'));
    return snapshot.size;
  } catch (error) {
    handleError(error, {
      message: 'Failed to get data models count',
      category: ErrorCategory.DATABASE
    });
    return 0;
  }
};

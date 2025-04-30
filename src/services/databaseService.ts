import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";

/**
 * Generic data fetching options
 */
export interface FetchOptions {
  select?: string[];
  filters?: [string, string, any][];
  order?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
  page?: number;
  pageSize?: number;
  startAfter?: DocumentData;
}

/**
 * Generic data fetching result
 */
export interface FetchResult<T> {
  data: T[];
  count: number | null;
  lastDoc?: DocumentData;
  error: Error | null;
}

/**
 * Fetch data from a collection with filtering, sorting, and pagination
 */
export async function fetchData<T>(
  collectionName: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  try {
    const {
      filters = [],
      order,
      limit: limitCount,
      startAfter: startAfterDoc
    } = options;

    // Build query constraints
    const constraints: QueryConstraint[] = [];

    // Apply filters
    filters.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator as any, value));
    });

    // Apply order
    if (order) {
      constraints.push(orderBy(order.field, order.direction || 'asc'));
    }

    // Apply limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    // Apply startAfter for pagination
    let queryRef = query(collection(db, collectionName), ...constraints);
    
    // Execute the query
    const snapshot = await getDocs(queryRef);
    
    // Convert the documents to data objects
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      data,
      count: snapshot.size,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      error: null
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        collection: collectionName,
        options,
      },
    });
    
    return { data: [], count: null, error: error as Error };
  }
}

/**
 * Fetch a single document by ID
 */
export async function fetchById<T>(
  collectionName: string,
  id: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        data: {
          id: docSnap.id,
          ...docSnap.data()
        } as T,
        error: null
      };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        collection: collectionName,
        id,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Insert a document
 */
export async function insertDocument<T extends { id?: string }>(
  collectionName: string,
  data: T
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // If id is provided, use it; otherwise, let Firestore generate one
    const docRef = data.id 
      ? doc(db, collectionName, data.id) 
      : doc(collection(db, collectionName));
    
    // Add timestamps
    const docData = {
      ...data,
      id: docRef.id, // Ensure id is included
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    // Save the document
    await setDoc(docRef, docData);
    
    // Return the data with the generated ID
    return {
      data: {
        ...docData,
        id: docRef.id,
        // Convert Firestore timestamps to regular dates for the return value
        created_at: new Date(),
        updated_at: new Date()
      } as T,
      error: null
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        collection: collectionName,
        data,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Update a document
 */
export async function updateDocument<T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const docRef = doc(db, collectionName, id);
    
    // Add updated timestamp
    const updateData = {
      ...data,
      updated_at: serverTimestamp()
    };
    
    // Update the document
    await updateDoc(docRef, updateData as any);
    
    // Fetch the updated document
    const updatedDoc = await getDoc(docRef);
    
    if (updatedDoc.exists()) {
      return {
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        } as T,
        error: null
      };
    } else {
      throw new Error(`Document with ID ${id} not found after update`);
    }
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        collection: collectionName,
        id,
        data,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    
    return { success: true, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        collection: collectionName,
        id,
      },
    });
    
    return { success: false, error: error as Error };
  }
}

/**
 * Convert Firestore timestamps to regular dates
 */
export function convertTimestamps<T>(data: T): T {
  if (!data) return data;
  
  const result = { ...data } as any;
  
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (value && typeof value === 'object') {
      result[key] = convertTimestamps(value);
    }
  });
  
  return result as T;
}

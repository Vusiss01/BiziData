import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  onSnapshot,
  QueryConstraint,
  DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { convertTimestamps } from "@/services/databaseService";

// Hook for fetching data once
export const useCollection = <T extends Record<string, any>>(
  collectionName: string,
  options?: {
    where?: [string, string, any][];
    orderBy?: [string, "asc" | "desc"];
    limit?: number;
  },
) => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query constraints
        const constraints: QueryConstraint[] = [];

        // Apply where clauses
        if (options?.where) {
          options.where.forEach(([field, operator, value]) => {
            constraints.push(where(field, operator as any, value));
          });
        }

        // Apply order by
        if (options?.orderBy) {
          const [field, direction] = options.orderBy;
          constraints.push(firestoreOrderBy(field, direction));
        }

        // Apply limit
        if (options?.limit) {
          constraints.push(firestoreLimit(options.limit));
        }

        // Create and execute query
        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        // Process results
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Convert any Firestore timestamps to regular dates
        const processedResults = results.map(item => convertTimestamps(item));

        setData(processedResults as Array<T & { id: string }>);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName, JSON.stringify(options)]);

  return { data, loading, error };
};

// Hook for real-time data
export const useRealtimeCollection = <T extends Record<string, any>>(
  collectionName: string,
  options?: {
    where?: [string, string, any][];
    orderBy?: [string, "asc" | "desc"];
    limit?: number;
  },
) => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Build query constraints
    const constraints: QueryConstraint[] = [];

    // Apply where clauses
    if (options?.where) {
      options.where.forEach(([field, operator, value]) => {
        constraints.push(where(field, operator as any, value));
      });
    }

    // Apply order by
    if (options?.orderBy) {
      const [field, direction] = options.orderBy;
      constraints.push(firestoreOrderBy(field, direction));
    }

    // Apply limit
    if (options?.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    // Create query
    const q = query(collection(db, collectionName), ...constraints);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Convert any Firestore timestamps to regular dates
        const processedResults = results.map(item => convertTimestamps(item));

        setData(processedResults as Array<T & { id: string }>);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [collectionName, JSON.stringify(options)]);

  return { data, loading, error };
};

// Hook for a single document/row
export const useDocument = <T extends Record<string, any>>(
  collectionName: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        if (!documentId) {
          setData(null);
          setLoading(false);
          return;
        }

        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const result = {
            id: docSnap.id,
            ...docSnap.data()
          };

          // Convert any Firestore timestamps to regular dates
          const processedResult = convertTimestamps(result);

          setData(processedResult as T);
        } else {
          setData(null);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchDocument();
  }, [collectionName, documentId]);

  return { data, loading, error };
};

// Hook for real-time document/row
export const useRealtimeDocument = <T extends Record<string, any>>(
  collectionName: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return () => {};
    }

    const docRef = doc(db, collectionName, documentId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const result = {
            id: docSnap.id,
            ...docSnap.data()
          };

          // Convert any Firestore timestamps to regular dates
          const processedResult = convertTimestamps(result);

          setData(processedResult as T);
        } else {
          setData(null);
        }

        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
};

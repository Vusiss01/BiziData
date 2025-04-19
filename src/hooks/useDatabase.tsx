import { useEffect, useState } from "react";
import { getFoodBaseClient } from "./useAuth";

// Hook for fetching data once
export const useCollection = <T extends Record<string, any>>(
  collectionPath: string,
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
        const foodbase = getFoodBaseClient();
        let query = foodbase.collection(collectionPath);

        // Apply where clauses
        if (options?.where) {
          for (const [field, operator, value] of options.where) {
            query = query.where(field, operator, value);
          }
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const result = await query.get();
        setData(result as Array<T & { id: string }>);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionPath, options]);

  return { data, loading, error };
};

// Hook for real-time data
export const useRealtimeCollection = <T extends Record<string, any>>(
  collectionPath: string,
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
    const foodbase = getFoodBaseClient();
    let query = foodbase.collection(collectionPath);

    // Apply where clauses
    if (options?.where) {
      for (const [field, operator, value] of options.where) {
        query = query.where(field, operator, value);
      }
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const unsubscribe = query.onSnapshot(
      (result) => {
        setData(result as Array<T & { id: string }>);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionPath, options]);

  return { data, loading, error };
};

// Hook for a single document
export const useDocument = <T extends Record<string, any>>(
  collectionPath: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const foodbase = getFoodBaseClient();
        const doc = await foodbase
          .collection(collectionPath)
          .doc(documentId)
          .get();
        setData(doc ? (doc.data as T) : null);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionPath, documentId]);

  return { data, loading, error };
};

// Hook for real-time document
export const useRealtimeDocument = <T extends Record<string, any>>(
  collectionPath: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const foodbase = getFoodBaseClient();
    const unsubscribe = foodbase
      .collection(collectionPath)
      .doc(documentId)
      .onSnapshot(
        (doc) => {
          setData(doc ? (doc.data as T) : null);
          setLoading(false);
        },
        (err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [collectionPath, documentId]);

  return { data, loading, error };
};

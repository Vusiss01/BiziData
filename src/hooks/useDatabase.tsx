import { useEffect, useState } from "react";
import { getSupabaseClient } from "./useAuth";

// Hook for fetching data once
export const useCollection = <T extends Record<string, any>>(
  tableName: string,
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
        const supabase = getSupabaseClient();
        let query = supabase.from(tableName).select('*');

        // Apply where clauses
        if (options?.where) {
          for (const [field, operator, value] of options.where) {
            // Convert Firebase-style operators to Supabase
            switch (operator) {
              case '==':
                query = query.eq(field, value);
                break;
              case '!=':
                query = query.neq(field, value);
                break;
              case '>':
                query = query.gt(field, value);
                break;
              case '>=':
                query = query.gte(field, value);
                break;
              case '<':
                query = query.lt(field, value);
                break;
              case '<=':
                query = query.lte(field, value);
                break;
              case 'in':
                query = query.in(field, value);
                break;
              case 'array-contains':
                // This is a bit different in Supabase - using contains
                query = query.contains(field, [value]);
                break;
              default:
                console.warn(`Operator ${operator} not supported in Supabase`);
            }
          }
        }

        // Apply order by
        if (options?.orderBy) {
          const [field, direction] = options.orderBy;
          query = query.order(field, { ascending: direction === 'asc' });
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: queryError } = await query;

        if (queryError) throw queryError;

        setData(result as Array<T & { id: string }>);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, options]);

  return { data, loading, error };
};

// Hook for real-time data using Supabase subscriptions
export const useRealtimeCollection = <T extends Record<string, any>>(
  tableName: string,
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
    const supabase = getSupabaseClient();

    // First, fetch the initial data
    const fetchInitialData = async () => {
      try {
        let query = supabase.from(tableName).select('*');

        // Apply where clauses
        if (options?.where) {
          for (const [field, operator, value] of options.where) {
            // Convert Firebase-style operators to Supabase
            switch (operator) {
              case '==':
                query = query.eq(field, value);
                break;
              case '!=':
                query = query.neq(field, value);
                break;
              case '>':
                query = query.gt(field, value);
                break;
              case '>=':
                query = query.gte(field, value);
                break;
              case '<':
                query = query.lt(field, value);
                break;
              case '<=':
                query = query.lte(field, value);
                break;
              case 'in':
                query = query.in(field, value);
                break;
              case 'array-contains':
                query = query.contains(field, [value]);
                break;
              default:
                console.warn(`Operator ${operator} not supported in Supabase`);
            }
          }
        }

        // Apply order by
        if (options?.orderBy) {
          const [field, direction] = options.orderBy;
          query = query.order(field, { ascending: direction === 'asc' });
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: queryError } = await query;

        if (queryError) throw queryError;

        setData(result as Array<T & { id: string }>);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up realtime subscription
    const subscription = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        // Update the data based on the change type
        if (payload.eventType === 'INSERT') {
          setData(prev => [...prev, payload.new as T & { id: string }]);
        } else if (payload.eventType === 'UPDATE') {
          setData(prev =>
            prev.map(item => item.id === payload.new.id ? payload.new as T & { id: string } : item)
          );
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tableName, options]);

  return { data, loading, error };
};

// Hook for a single document/row
export const useDocument = <T extends Record<string, any>>(
  tableName: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: result, error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', documentId)
          .single();

        if (queryError) throw queryError;

        setData(result as T);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, documentId]);

  return { data, loading, error };
};

// Hook for real-time document/row using Supabase subscriptions
export const useRealtimeDocument = <T extends Record<string, any>>(
  tableName: string,
  documentId: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // First, fetch the initial data
    const fetchInitialData = async () => {
      try {
        const { data: result, error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', documentId)
          .single();

        if (queryError) throw queryError;

        setData(result as T);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up realtime subscription
    const subscription = supabase
      .channel(`${tableName}-${documentId}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: tableName, filter: `id=eq.${documentId}` },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setData(payload.new as T);
            } else if (payload.eventType === 'DELETE') {
              setData(null);
            }
          }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tableName, documentId]);

  return { data, loading, error };
};

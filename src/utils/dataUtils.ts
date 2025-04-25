import { supabase } from "@/lib/supabase";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";

/**
 * Generic data fetching options
 */
export interface FetchOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Generic data fetching result
 */
export interface FetchResult<T> {
  data: T[];
  count: number | null;
  error: Error | null;
}

/**
 * Fetch data from a table with filtering, sorting, and pagination
 */
export async function fetchData<T>(
  table: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  try {
    const {
      select = '*',
      filters = {},
      order,
      limit,
      page,
      pageSize = 10,
    } = options;
    
    // Start building the query
    let query = supabase.from(table).select(select, { count: 'exact' });
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle range filters
          if ('gt' in value) query = query.gt(key, value.gt);
          if ('gte' in value) query = query.gte(key, value.gte);
          if ('lt' in value) query = query.lt(key, value.lt);
          if ('lte' in value) query = query.lte(key, value.lte);
          if ('eq' in value) query = query.eq(key, value.eq);
          if ('neq' in value) query = query.neq(key, value.neq);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    
    // Apply sorting
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? true });
    }
    
    // Apply pagination
    if (page !== undefined) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    } else if (limit) {
      query = query.limit(limit);
    }
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return { data: data || [], count, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        options,
      },
    });
    
    return { data: [], count: null, error: error as Error };
  }
}

/**
 * Fetch a single record by ID
 */
export async function fetchById<T>(
  table: string,
  id: string,
  select: string = '*'
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        id,
        select,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Insert a record
 */
export async function insertRecord<T>(
  table: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: result as T, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        data,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Update a record
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: result as T, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        id,
        data,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a record
 */
export async function deleteRecord(
  table: string,
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        id,
      },
    });
    
    return { success: false, error: error as Error };
  }
}

/**
 * Batch insert records
 */
export async function batchInsert<T>(
  table: string,
  records: Partial<T>[]
): Promise<{ count: number; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select();
    
    if (error) {
      throw error;
    }
    
    return { count: data?.length || 0, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        recordCount: records.length,
      },
    });
    
    return { count: 0, error: error as Error };
  }
}

/**
 * Batch update records
 */
export async function batchUpdate<T>(
  table: string,
  records: { id: string; data: Partial<T> }[]
): Promise<{ count: number; error: Error | null }> {
  try {
    let successCount = 0;
    
    // Supabase doesn't support batch updates directly, so we need to do them one by one
    for (const record of records) {
      const { error } = await supabase
        .from(table)
        .update(record.data)
        .eq('id', record.id);
      
      if (!error) {
        successCount++;
      }
    }
    
    return { count: successCount, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        table,
        recordCount: records.length,
      },
    });
    
    return { count: 0, error: error as Error };
  }
}

/**
 * Execute a stored procedure
 */
export async function callProcedure<T>(
  procedure: string,
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc(procedure, params);
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        procedure,
        params,
      },
    });
    
    return { data: null, error: error as Error };
  }
}

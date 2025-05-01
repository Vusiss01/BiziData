import { useState, useEffect, useCallback } from 'react';

/**
 * Status badge variant
 */
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

/**
 * Get status badge variant based on status string
 */
export const getStatusVariant = (status: string): StatusVariant => {
  const statusLower = status.toLowerCase();

  if (['active', 'open', 'approved', 'completed', 'verified'].includes(statusLower)) {
    return 'success';
  }

  if (['pending', 'pending_verification', 'in_progress', 'waiting'].includes(statusLower)) {
    return 'warning';
  }

  if (['suspended', 'closed', 'rejected', 'failed', 'cancelled', 'error'].includes(statusLower)) {
    return 'error';
  }

  if (['draft', 'info', 'new'].includes(statusLower)) {
    return 'info';
  }

  return 'default';
};

/**
 * Get status badge color classes based on status string
 */
export const getStatusColor = (status: string): string => {
  const variant = getStatusVariant(status);

  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-amber-100 text-amber-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Format a status string for display
 */
export const formatStatus = (status: string): string => {
  if (!status) return 'Unknown';

  // Handle special cases
  if (status === 'pending_verification') return 'Pending Verification';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'unknown') return 'Unknown';

  // Default formatting: capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a date for display
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Date(date).toLocaleDateString(undefined, options || defaultOptions);
};

/**
 * Format a date and time for display
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';

  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a time for display
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '';

  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format a number with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for handling pagination
 */
export function usePagination(totalItems: number, itemsPerPage = 10, initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const pageItems = useCallback((items: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage]);

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    pageItems,
    itemsPerPage,
  };
}

/**
 * Custom hook for handling sorting
 */
export function useSorting<T>(initialSortField?: keyof T, initialSortDirection: 'asc' | 'desc' = 'asc') {
  const [sortField, setSortField] = useState<keyof T | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  const toggleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const sortItems = useCallback((items: T[]): T[] => {
    if (!sortField) return [...items];

    return [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      // Handle null/undefined values
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      // Compare based on type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Default comparison
      return sortDirection === 'asc'
        ? aValue < bValue ? -1 : 1
        : aValue < bValue ? 1 : -1;
    });
  }, [sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    toggleSort,
    sortItems,
  };
}

/**
 * Custom hook for handling filtering
 */
export function useFiltering<T>(items: T[]) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const setFilter = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearFilter = useCallback((field: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filteredItems = useCallback(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([field, value]) => {
        if (value === undefined || value === null || value === '') return true;

        const fieldParts = field.split('.');
        let fieldValue = item as any;

        for (const part of fieldParts) {
          if (fieldValue === undefined || fieldValue === null) return false;
          fieldValue = fieldValue[part];
        }

        if (fieldValue === undefined || fieldValue === null) return false;

        // Handle different filter types
        if (Array.isArray(value)) {
          return value.includes(fieldValue);
        }

        if (typeof value === 'string' && typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(value.toLowerCase());
        }

        return fieldValue === value;
      });
    });
  }, [items, filters]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    filteredItems,
  };
}

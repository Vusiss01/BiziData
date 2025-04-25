import { useState, ChangeEvent } from 'react';

/**
 * Generic form data type
 */
export type FormData = Record<string, any>;

/**
 * Form field validation rule
 */
export interface ValidationRule {
  validate: (value: any, formData?: FormData) => boolean;
  message: string;
}

/**
 * Form field validation rules
 */
export interface FieldValidation {
  [field: string]: ValidationRule[];
}

/**
 * Form validation errors
 */
export type ValidationErrors = Record<string, string>;

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),
  
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Skip if empty (use required rule for required fields)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),
  
  minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Skip if empty
      return String(value).length >= length;
    },
    message,
  }),
  
  maxLength: (length: number, message = `Must be no more than ${length} characters`): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Skip if empty
      return String(value).length <= length;
    },
    message,
  }),
  
  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Skip if empty
      return regex.test(String(value));
    },
    message,
  }),
  
  match: (field: string, message = 'Fields do not match'): ValidationRule => ({
    validate: (value, formData) => {
      if (!formData) return true;
      return value === formData[field];
    },
    message,
  }),
};

/**
 * Custom hook for form handling
 */
export function useForm<T extends FormData>(initialValues: T, validationRules?: FieldValidation) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  /**
   * Handle form field change
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  /**
   * Handle nested field change (e.g., formData.address.street)
   */
  const handleNestedChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    parentField: string
  ) => {
    const { name, value, type } = e.target;
    const fieldName = `${parentField}.${name}`;
    
    setFormData((prev) => {
      const parent = prev[parentField] || {};
      
      // Handle checkbox inputs
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        return {
          ...prev,
          [parentField]: {
            ...parent,
            [name]: checked,
          },
        };
      }
      
      return {
        ...prev,
        [parentField]: {
          ...parent,
          [name]: value,
        },
      };
    });
    
    // Mark field as touched
    if (!touched[fieldName]) {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
    }
    
    // Clear error when field is edited
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  
  /**
   * Handle select change
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  /**
   * Handle nested select change
   */
  const handleNestedSelectChange = (name: string, value: string, parentField: string) => {
    const fieldName = `${parentField}.${name}`;
    
    setFormData((prev) => {
      const parent = prev[parentField] || {};
      return {
        ...prev,
        [parentField]: {
          ...parent,
          [name]: value,
        },
      };
    });
    
    // Mark field as touched
    if (!touched[fieldName]) {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
    }
    
    // Clear error when field is edited
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  
  /**
   * Set a specific field value
   */
  const setFieldValue = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  /**
   * Set a specific field error
   */
  const setFieldError = (name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  
  /**
   * Mark a field as touched
   */
  const touchField = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };
  
  /**
   * Reset the form
   */
  const resetForm = () => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  };
  
  /**
   * Validate the form
   */
  const validateForm = (): boolean => {
    if (!validationRules) return true;
    
    const newErrors: ValidationErrors = {};
    
    // Check each field with validation rules
    Object.entries(validationRules).forEach(([field, rules]) => {
      // Get the field value (supports nested fields like 'address.street')
      const fieldParts = field.split('.');
      let value = formData;
      for (const part of fieldParts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      
      // Apply each validation rule
      for (const rule of rules) {
        if (!rule.validate(value, formData)) {
          newErrors[field] = rule.message;
          break;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return {
    formData,
    errors,
    touched,
    handleChange,
    handleNestedChange,
    handleSelectChange,
    handleNestedSelectChange,
    setFieldValue,
    setFieldError,
    touchField,
    resetForm,
    validateForm,
    setFormData,
  };
}

/**
 * Format a date string to YYYY-MM-DD
 */
export const formatDateForInput = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toISOString().split('T')[0];
};

/**
 * Format a time string to HH:MM
 */
export const formatTimeForInput = (timeString: string | Date): string => {
  const date = typeof timeString === 'string' ? new Date(timeString) : timeString;
  return date.toTimeString().slice(0, 5);
};

/**
 * Parse a form date and time to ISO string
 */
export const parseDateTimeToISO = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};

/**
 * Get nested value from an object using a path string
 * Example: getNestedValue(user, 'address.street')
 */
export const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  
  return value;
};

/**
 * Set nested value in an object using a path string
 * Example: setNestedValue(user, 'address.street', '123 Main St')
 */
export const setNestedValue = (obj: any, path: string, value: any): any => {
  if (!obj || !path) return obj;
  
  const result = { ...obj };
  const parts = path.split('.');
  
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = current[part] !== undefined ? { ...current[part] } : {};
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
};

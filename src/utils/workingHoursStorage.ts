// Utility functions for handling working hours in localStorage

export interface WorkingHoursItem {
  open: string;
  close: string;
  closed: boolean;
}

export interface WorkingHours {
  monday: WorkingHoursItem;
  tuesday: WorkingHoursItem;
  wednesday: WorkingHoursItem;
  thursday: WorkingHoursItem;
  friday: WorkingHoursItem;
  saturday: WorkingHoursItem;
  sunday: WorkingHoursItem;
}

// Default working hours template
export const defaultWorkingHours: WorkingHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '10:00', close: '15:00', closed: false },
  sunday: { open: '10:00', close: '15:00', closed: true },
};

// Save working hours to localStorage
export const saveWorkingHours = (restaurantId: string, workingHours: WorkingHours): void => {
  try {
    const key = `restaurant_${restaurantId}_working_hours`;
    localStorage.setItem(key, JSON.stringify(workingHours));
    console.log(`Working hours saved to localStorage for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error saving working hours to localStorage:', error);
  }
};

// Get working hours from localStorage
export const getWorkingHours = (restaurantId: string): WorkingHours | null => {
  try {
    const key = `restaurant_${restaurantId}_working_hours`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      return JSON.parse(storedData) as WorkingHours;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving working hours from localStorage:', error);
    return null;
  }
};

// Update working hours in localStorage
export const updateWorkingHours = (
  restaurantId: string, 
  day: keyof WorkingHours, 
  field: keyof WorkingHoursItem, 
  value: string | boolean
): void => {
  try {
    const currentHours = getWorkingHours(restaurantId) || defaultWorkingHours;
    
    const updatedHours = {
      ...currentHours,
      [day]: {
        ...currentHours[day],
        [field]: value
      }
    };
    
    saveWorkingHours(restaurantId, updatedHours);
  } catch (error) {
    console.error('Error updating working hours in localStorage:', error);
  }
};

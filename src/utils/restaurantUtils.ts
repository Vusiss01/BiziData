import { WorkingHours } from '@/services/restaurantService';

/**
 * Check if a restaurant is currently open based on its working hours
 * @param workingHours The restaurant's working hours
 * @returns Boolean indicating if the restaurant is currently open
 */
export const isRestaurantOpen = (workingHours?: WorkingHours[] | any): boolean => {
  console.log('isRestaurantOpen called with:', workingHours);

  // Check if workingHours is an array
  if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
    console.log('Restaurant is closed: working_hours is not a valid array');
    return false;
  }

  // Get current date and time
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log('Current day and time:', currentDay, `${currentHour}:${currentMinute}`);

  // Find the working hours for the current day
  const todayHours = workingHours.find(
    hours => hours && hours.day && hours.day.toLowerCase() === currentDay.toLowerCase()
  );

  console.log('Today\'s hours found:', todayHours);

  // If no hours for today or explicitly marked as closed, restaurant is closed
  if (!todayHours || todayHours.is_closed) {
    console.log('Restaurant is closed: no hours for today or marked as closed');
    return false;
  }

  // Check if open and close times are valid
  if (!todayHours.open || !todayHours.close) {
    console.log('Restaurant is closed: invalid open or close times');
    return false;
  }

  // Parse opening and closing hours
  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

  // Convert current time, opening time, and closing time to minutes for easy comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;

  console.log('Time comparison (in minutes):',
    `Current: ${currentTimeInMinutes}`,
    `Open: ${openTimeInMinutes}`,
    `Close: ${closeTimeInMinutes}`
  );

  // Check if current time is between opening and closing times
  const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  console.log('Restaurant is open:', isOpen);
  return isOpen;
};

/**
 * Get a formatted string of a restaurant's hours for today
 * @param workingHours The restaurant's working hours
 * @returns Formatted string of today's hours (e.g., "Open today: 9:00 AM - 5:00 PM" or "Closed today")
 */
export const getTodayHours = (workingHours?: WorkingHours[] | any): string => {
  console.log('getTodayHours called with:', workingHours);

  // Check if workingHours is an array
  if (!workingHours || !Array.isArray(workingHours) || workingHours.length === 0) {
    console.log('Hours not available: working_hours is not a valid array');
    return "Hours not available";
  }

  // Get current day
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  console.log('Current day:', currentDay);

  // Find the working hours for the current day
  const todayHours = workingHours.find(
    hours => hours && hours.day && hours.day.toLowerCase() === currentDay.toLowerCase()
  );

  console.log('Today\'s hours found:', todayHours);

  // If no hours for today or explicitly marked as closed, return "Closed today"
  if (!todayHours || todayHours.is_closed) {
    console.log('Closed today: no hours for today or marked as closed');
    return "Closed today";
  }

  // Check if open and close times are valid
  if (!todayHours.open || !todayHours.close) {
    console.log('Hours not available: invalid open or close times');
    return "Hours not available";
  }

  // Format the hours in 12-hour format
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formattedHours = `Open today: ${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
  console.log('Formatted hours:', formattedHours);
  return formattedHours;
};

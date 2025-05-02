import { collection, addDoc, updateDoc, doc, Timestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addTrackingEvent, updateDriverLocation } from './trackingService';
import { getAuth } from 'firebase/auth';

// Locations for simulation
const LOCATIONS = [
  { latitude: 40.7128, longitude: -74.0060, address: 'Downtown' },
  { latitude: 40.7831, longitude: -73.9712, address: 'Uptown' },
  { latitude: 40.7589, longitude: -73.9851, address: 'Midtown' },
  { latitude: 40.7241, longitude: -73.9956, address: 'West End' },
  { latitude: 40.7214, longitude: -73.9879, address: 'East Village' },
  { latitude: 40.7464, longitude: -73.9857, address: 'Murray Hill' },
  { latitude: 40.7587, longitude: -73.9787, address: 'Times Square' },
  { latitude: 40.7484, longitude: -73.9857, address: 'Gramercy' }
];

// Vehicle types
const VEHICLES = ['Car', 'Scooter', 'Bicycle', 'Motorcycle'];

// Driver statuses
const STATUSES = ['available', 'en route', 'delivering', 'picking up'];

// Event types
const EVENT_TYPES = ['location_update', 'status_change', 'order_assigned', 'order_delivered'];

// Restaurant names for orders
const RESTAURANTS = [
  'Pizza Palace',
  'Burger Bonanza',
  'Sushi Supreme',
  'Taco Time',
  'Pasta Paradise',
  'Curry Corner',
  'Salad Sensation',
  'Breakfast Bistro'
];

/**
 * Initialize driver data in Firebase
 */
export const initializeDriverData = async () => {
  try {
    // Check if we already have driver_locations collection with data
    const locationsQuery = query(
      collection(db, 'driver_locations'),
      limit(1)
    );
    
    const snapshot = await getDocs(locationsQuery);
    
    if (!snapshot.empty) {
      console.log('Driver data already initialized');
      return true;
    }
    
    // Get users with driver role
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );
    
    const driversSnapshot = await getDocs(driversQuery);
    
    if (driversSnapshot.empty) {
      // No drivers found, create some sample drivers
      await createSampleDrivers();
    }
    
    // Initialize locations for all drivers
    const allDriversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );
    
    const allDriversSnapshot = await getDocs(allDriversQuery);
    
    for (const driverDoc of allDriversSnapshot.docs) {
      const driverData = driverDoc.data();
      const driverId = driverDoc.id;
      
      // Random location
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      
      // Random vehicle
      const vehicle = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
      
      // Random status
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      
      // Create driver location document
      await addDoc(collection(db, 'driver_locations'), {
        driver_id: driverId,
        name: driverData.name || 'Unknown Driver',
        location,
        status,
        lastUpdated: Timestamp.now(),
        vehicle,
        currentOrder: status !== 'available' ? `ORD-${1000 + Math.floor(Math.random() * 1000)}` : undefined
      });
      
      // Add initial tracking event
      await addTrackingEvent({
        type: 'location_update',
        driver: {
          id: driverId,
          name: driverData.name || 'Unknown Driver',
          avatar: driverData.avatar_url
        },
        location,
        timestamp: Timestamp.now()
      });
    }
    
    console.log('Driver data initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing driver data:', error);
    return false;
  }
};

/**
 * Create sample drivers if none exist
 */
const createSampleDrivers = async () => {
  const sampleDrivers = [
    {
      name: 'David Chen',
      email: 'david.chen@example.com',
      phone: '555-123-4567',
      role: 'driver',
      is_verified: true,
      current_suburb: 'Downtown',
      rating: 4.8,
      completed_orders: 128,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
    },
    {
      name: 'Maria Rodriguez',
      email: 'maria.r@example.com',
      phone: '555-234-5678',
      role: 'driver',
      is_verified: true,
      current_suburb: 'Uptown',
      rating: 4.7,
      completed_orders: 95,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
    },
    {
      name: 'James Wilson',
      email: 'james.w@example.com',
      phone: '555-345-6789',
      role: 'driver',
      is_verified: true,
      current_suburb: 'Midtown',
      rating: 4.5,
      completed_orders: 67,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james'
    },
    {
      name: 'Aisha Patel',
      email: 'aisha.p@example.com',
      phone: '555-456-7890',
      role: 'driver',
      is_verified: true,
      current_suburb: 'West End',
      rating: 4.9,
      completed_orders: 112,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha'
    }
  ];
  
  for (const driver of sampleDrivers) {
    await addDoc(collection(db, 'users'), {
      ...driver,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
  }
  
  console.log('Sample drivers created');
};

/**
 * Generate a random tracking event
 */
export const generateRandomEvent = async () => {
  try {
    // Get all driver locations
    const locationsQuery = query(
      collection(db, 'driver_locations')
    );
    
    const snapshot = await getDocs(locationsQuery);
    
    if (snapshot.empty) {
      console.log('No drivers found');
      return false;
    }
    
    // Pick a random driver
    const randomIndex = Math.floor(Math.random() * snapshot.docs.length);
    const driverDoc = snapshot.docs[randomIndex];
    const driverData = driverDoc.data();
    const driverId = driverData.driver_id;
    const driverName = driverData.name;
    
    // Pick a random event type
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    
    switch (eventType) {
      case 'location_update':
        // Update to a new random location
        const newLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        await updateDriverLocation(driverId, newLocation);
        
        // Update the driver_locations document
        await updateDoc(doc(db, 'driver_locations', driverDoc.id), {
          location: newLocation,
          lastUpdated: Timestamp.now()
        });
        break;
        
      case 'status_change':
        // Change to a new random status
        const newStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        
        // Update the driver_locations document
        await updateDoc(doc(db, 'driver_locations', driverDoc.id), {
          status: newStatus,
          lastUpdated: Timestamp.now(),
          // If status is not available, assign a random order
          currentOrder: newStatus !== 'available' 
            ? `ORD-${1000 + Math.floor(Math.random() * 1000)}` 
            : null
        });
        
        // Add tracking event
        await addTrackingEvent({
          type: 'status_change',
          driver: {
            id: driverId,
            name: driverName,
            avatar: driverData.avatar_url
          },
          status: newStatus,
          timestamp: Timestamp.now()
        });
        break;
        
      case 'order_assigned':
        // Assign a new order
        const restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
        const orderId = `ORD-${1000 + Math.floor(Math.random() * 1000)}`;
        
        // Update the driver_locations document
        await updateDoc(doc(db, 'driver_locations', driverDoc.id), {
          status: 'en route',
          lastUpdated: Timestamp.now(),
          currentOrder: orderId
        });
        
        // Add tracking event
        await addTrackingEvent({
          type: 'order_assigned',
          driver: {
            id: driverId,
            name: driverName,
            avatar: driverData.avatar_url
          },
          order: {
            id: orderId,
            restaurant
          },
          timestamp: Timestamp.now()
        });
        break;
        
      case 'order_delivered':
        // Only generate if driver has a current order
        if (driverData.currentOrder) {
          const restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
          
          // Update the driver_locations document
          await updateDoc(doc(db, 'driver_locations', driverDoc.id), {
            status: 'available',
            lastUpdated: Timestamp.now(),
            currentOrder: null
          });
          
          // Add tracking event
          await addTrackingEvent({
            type: 'order_delivered',
            driver: {
              id: driverId,
              name: driverName,
              avatar: driverData.avatar_url
            },
            order: {
              id: driverData.currentOrder,
              restaurant
            },
            timestamp: Timestamp.now()
          });
        } else {
          // If no current order, generate a location update instead
          const newLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
          await updateDriverLocation(driverId, newLocation);
          
          // Update the driver_locations document
          await updateDoc(doc(db, 'driver_locations', driverDoc.id), {
            location: newLocation,
            lastUpdated: Timestamp.now()
          });
        }
        break;
    }
    
    return true;
  } catch (error) {
    console.error('Error generating random event:', error);
    return false;
  }
};

// Interval ID for simulation
let simulationIntervalId: number | null = null;

/**
 * Start the driver simulation
 */
export const startDriverSimulation = (intervalMs = 5000) => {
  if (simulationIntervalId) {
    console.log('Simulation already running');
    return;
  }
  
  // Initialize driver data first
  initializeDriverData().then(() => {
    // Start generating random events at the specified interval
    simulationIntervalId = window.setInterval(() => {
      generateRandomEvent();
    }, intervalMs);
    
    console.log(`Driver simulation started with interval of ${intervalMs}ms`);
  });
};

/**
 * Stop the driver simulation
 */
export const stopDriverSimulation = () => {
  if (simulationIntervalId) {
    window.clearInterval(simulationIntervalId);
    simulationIntervalId = null;
    console.log('Driver simulation stopped');
  }
};

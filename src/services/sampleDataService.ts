import { collection, query, getDocs, addDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ErrorCategory, handleError } from '@/utils/errorHandler';
import { initializeDefaultDocumentation } from './documentationService';

/**
 * Initialize sample restaurants if none exist
 */
export const initializeSampleRestaurants = async (): Promise<boolean> => {
  try {
    // Check if we already have restaurants
    const restaurantsQuery = query(collection(db, 'restaurants'), limit(1));
    const snapshot = await getDocs(restaurantsQuery);

    if (!snapshot.empty) {
      console.log('Restaurants already exist, skipping initialization');
      return true;
    }

    console.log('Initializing sample restaurants');

    // Sample restaurants
    const sampleRestaurants = [
      {
        name: "Burger Palace",
        description: "Gourmet burgers and sides",
        address: "123 Main St, Anytown, USA",
        phone: "555-123-4567",
        email: "info@burgerpalace.com",
        status: "active",
        cuisine_type: "American",
        price_range: "$$",
        rating: 4.5,
        opening_hours: {
          monday: { open: "11:00", close: "22:00" },
          tuesday: { open: "11:00", close: "22:00" },
          wednesday: { open: "11:00", close: "22:00" },
          thursday: { open: "11:00", close: "22:00" },
          friday: { open: "11:00", close: "23:00" },
          saturday: { open: "11:00", close: "23:00" },
          sunday: { open: "12:00", close: "21:00" }
        },
        owner_id: "sample_owner_1",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        name: "Pizza Heaven",
        description: "Authentic Italian pizzas",
        address: "456 Oak Ave, Somewhere, USA",
        phone: "555-987-6543",
        email: "contact@pizzaheaven.com",
        status: "active",
        cuisine_type: "Italian",
        price_range: "$$",
        rating: 4.2,
        opening_hours: {
          monday: { open: "12:00", close: "22:00" },
          tuesday: { open: "12:00", close: "22:00" },
          wednesday: { open: "12:00", close: "22:00" },
          thursday: { open: "12:00", close: "22:00" },
          friday: { open: "12:00", close: "23:30" },
          saturday: { open: "12:00", close: "23:30" },
          sunday: { open: "12:00", close: "22:00" }
        },
        owner_id: "sample_owner_2",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        name: "Sushi Express",
        description: "Fresh sushi and Japanese cuisine",
        address: "789 Pine Rd, Elsewhere, USA",
        phone: "555-456-7890",
        email: "hello@sushiexpress.com",
        status: "active",
        cuisine_type: "Japanese",
        price_range: "$$$",
        rating: 4.7,
        opening_hours: {
          monday: { open: "11:30", close: "21:30" },
          tuesday: { open: "11:30", close: "21:30" },
          wednesday: { open: "11:30", close: "21:30" },
          thursday: { open: "11:30", close: "21:30" },
          friday: { open: "11:30", close: "22:30" },
          saturday: { open: "11:30", close: "22:30" },
          sunday: { open: "12:30", close: "21:00" }
        },
        owner_id: "sample_owner_3",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        name: "Taco Fiesta",
        description: "Authentic Mexican street food",
        address: "321 Elm St, Nowhere, USA",
        phone: "555-789-0123",
        email: "hola@tacofiesta.com",
        status: "active",
        cuisine_type: "Mexican",
        price_range: "$",
        rating: 4.3,
        opening_hours: {
          monday: { open: "10:00", close: "21:00" },
          tuesday: { open: "10:00", close: "21:00" },
          wednesday: { open: "10:00", close: "21:00" },
          thursday: { open: "10:00", close: "21:00" },
          friday: { open: "10:00", close: "22:00" },
          saturday: { open: "10:00", close: "22:00" },
          sunday: { open: "11:00", close: "20:00" }
        },
        owner_id: "sample_owner_4",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        name: "Noodle House",
        description: "Asian noodles and soups",
        address: "654 Maple Dr, Somewhere Else, USA",
        phone: "555-321-6547",
        email: "info@noodlehouse.com",
        status: "active",
        cuisine_type: "Asian Fusion",
        price_range: "$$",
        rating: 4.1,
        opening_hours: {
          monday: { open: "11:00", close: "21:00" },
          tuesday: { open: "11:00", close: "21:00" },
          wednesday: { open: "11:00", close: "21:00" },
          thursday: { open: "11:00", close: "21:00" },
          friday: { open: "11:00", close: "22:00" },
          saturday: { open: "11:00", close: "22:00" },
          sunday: { open: "12:00", close: "20:00" }
        },
        owner_id: "sample_owner_5",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      }
    ];

    // Add each restaurant
    for (const restaurant of sampleRestaurants) {
      await addDoc(collection(db, 'restaurants'), restaurant);
    }

    console.log('Sample restaurants initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize sample restaurants',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Initialize sample orders if none exist
 */
export const initializeSampleOrders = async (): Promise<boolean> => {
  try {
    // Check if we already have orders
    const ordersQuery = query(collection(db, 'orders'), limit(1));
    const snapshot = await getDocs(ordersQuery);

    if (!snapshot.empty) {
      console.log('Orders already exist, skipping initialization');
      return true;
    }

    // Get restaurants to reference in orders
    const restaurantsQuery = query(collection(db, 'restaurants'));
    const restaurantsSnapshot = await getDocs(restaurantsQuery);

    if (restaurantsSnapshot.empty) {
      console.log('No restaurants found, initializing sample restaurants first');
      await initializeSampleRestaurants();

      // Get restaurants again
      const newRestaurantsSnapshot = await getDocs(restaurantsQuery);
      if (newRestaurantsSnapshot.empty) {
        console.error('Failed to initialize restaurants');
        return false;
      }
    }

    // Get restaurant data
    const restaurants = restaurantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Initializing sample orders');

    // Sample orders
    const sampleOrders = [
      {
        restaurant: {
          id: restaurants[0]?.id || 'unknown',
          name: restaurants[0]?.name || 'Unknown Restaurant',
          logo: null
        },
        customer: {
          id: 'customer_1',
          name: 'John Doe',
          address: '123 Customer St, Anytown, USA',
          phone: '555-111-2222'
        },
        items: [
          {
            id: 'item_1',
            name: 'Cheeseburger',
            quantity: 2,
            price: 8.99
          },
          {
            id: 'item_2',
            name: 'French Fries',
            quantity: 1,
            price: 3.99
          }
        ],
        total: 21.97,
        status: 'completed',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        delivery_time: 25 // minutes
      },
      {
        restaurant: {
          id: restaurants[1]?.id || 'unknown',
          name: restaurants[1]?.name || 'Unknown Restaurant',
          logo: null
        },
        customer: {
          id: 'customer_2',
          name: 'Jane Smith',
          address: '456 Customer Ave, Somewhere, USA',
          phone: '555-333-4444'
        },
        items: [
          {
            id: 'item_3',
            name: 'Pepperoni Pizza',
            quantity: 1,
            price: 14.99
          },
          {
            id: 'item_4',
            name: 'Garlic Bread',
            quantity: 1,
            price: 4.99
          }
        ],
        total: 19.98,
        status: 'completed',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        delivery_time: 30 // minutes
      },
      {
        restaurant: {
          id: restaurants[2]?.id || 'unknown',
          name: restaurants[2]?.name || 'Unknown Restaurant',
          logo: null
        },
        customer: {
          id: 'customer_3',
          name: 'Bob Johnson',
          address: '789 Customer Blvd, Elsewhere, USA',
          phone: '555-555-6666'
        },
        items: [
          {
            id: 'item_5',
            name: 'California Roll',
            quantity: 2,
            price: 9.99
          },
          {
            id: 'item_6',
            name: 'Miso Soup',
            quantity: 1,
            price: 2.99
          }
        ],
        total: 22.97,
        status: 'pending',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      }
    ];

    // Add each order
    for (const order of sampleOrders) {
      await addDoc(collection(db, 'orders'), order);
    }

    console.log('Sample orders initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize sample orders',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Initialize sample users if none exist
 */
export const initializeSampleUsers = async (): Promise<boolean> => {
  try {
    // Check if we already have users
    const usersQuery = query(collection(db, 'users'), limit(1));
    const snapshot = await getDocs(usersQuery);

    if (!snapshot.empty) {
      console.log('Users already exist, skipping initialization');
      return true;
    }

    console.log('Initializing sample users');

    // Sample users
    const sampleUsers = [
      {
        id: 'sample_owner_1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        role: 'owner',
        phone: '555-123-4567',
        address: '123 Owner St, Anytown, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_owner_2',
        name: 'Maria Garcia',
        email: 'maria@example.com',
        role: 'owner',
        phone: '555-234-5678',
        address: '456 Owner Ave, Somewhere, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_owner_3',
        name: 'Hiroshi Tanaka',
        email: 'hiroshi@example.com',
        role: 'owner',
        phone: '555-345-6789',
        address: '789 Owner Rd, Elsewhere, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_owner_4',
        name: 'Carlos Rodriguez',
        email: 'carlos@example.com',
        role: 'owner',
        phone: '555-456-7890',
        address: '321 Owner Dr, Nowhere, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_owner_5',
        name: 'Li Wei',
        email: 'liwei@example.com',
        role: 'owner',
        phone: '555-567-8901',
        address: '654 Owner Ln, Somewhere Else, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_driver_1',
        name: 'David Smith',
        email: 'david@example.com',
        role: 'driver',
        phone: '555-678-9012',
        address: '123 Driver St, Anytown, USA',
        is_verified: true,
        vehicle_type: 'Car',
        rating: 4.8,
        completed_orders: 156,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_driver_2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'driver',
        phone: '555-789-0123',
        address: '456 Driver Ave, Somewhere, USA',
        is_verified: true,
        vehicle_type: 'Motorcycle',
        rating: 4.6,
        completed_orders: 98,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: 'sample_admin',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        phone: '555-890-1234',
        address: '123 Admin St, Anytown, USA',
        is_verified: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      }
    ];

    // Add each user
    for (const user of sampleUsers) {
      await addDoc(collection(db, 'users'), user);
    }

    console.log('Sample users initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize sample users',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Initialize all sample data
 */
export const initializeAllSampleData = async (): Promise<boolean> => {
  try {
    console.log('Initializing all sample data');

    // Initialize users first
    const usersInitialized = await initializeSampleUsers();
    if (!usersInitialized) {
      console.error('Failed to initialize sample users');
      return false;
    }

    // Initialize restaurants
    const restaurantsInitialized = await initializeSampleRestaurants();
    if (!restaurantsInitialized) {
      console.error('Failed to initialize sample restaurants');
      return false;
    }

    // Initialize orders
    const ordersInitialized = await initializeSampleOrders();
    if (!ordersInitialized) {
      console.error('Failed to initialize sample orders');
      return false;
    }

    // Initialize documentation
    const documentationInitialized = await initializeDefaultDocumentation();
    if (!documentationInitialized) {
      console.error('Failed to initialize documentation');
      return false;
    }

    console.log('All sample data initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize all sample data',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

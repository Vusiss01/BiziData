import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from './databaseService';
import { ErrorCategory, handleError } from '@/utils/errorHandler';

export interface Order {
  id?: string;
  restaurant: {
    id: string;
    name: string;
    logo?: string;
  };
  customer: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  driver_id?: string;
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
  delivery_time?: Date | Timestamp;
}

export interface OrderSummary {
  id: string;
  restaurant: string;
  restaurantLogo?: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  date: string;
  time: string;
}

/**
 * Get all orders
 */
export const getAllOrders = async (): Promise<OrderSummary[]> => {
  try {
    // Create query for orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc')
    );
    
    // Execute query
    const snapshot = await getDocs(ordersQuery);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Process order data
    const orders = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      
      // Format date and time
      const createdAt = data.created_at instanceof Date ? data.created_at : new Date();
      const dateStr = createdAt.toISOString().split('T')[0];
      const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return {
        id: doc.id,
        restaurant: data.restaurant?.name || 'Unknown Restaurant',
        restaurantLogo: data.restaurant?.logo,
        customer: data.customer?.name || 'Unknown Customer',
        items: Array.isArray(data.items) ? data.items.length : 0,
        total: typeof data.total === 'number' ? data.total : 0,
        status: data.status || 'pending',
        date: dateStr,
        time: timeStr
      } as OrderSummary;
    });
    
    return orders;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch orders',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDocs(query(collection(db, 'orders'), where('__name__', '==', orderId)));
    
    if (docSnap.empty) {
      return null;
    }
    
    const data = docSnap.docs[0].data();
    return convertTimestamps({
      id: docSnap.docs[0].id,
      ...data
    }) as Order;
  } catch (error) {
    handleError(error, {
      message: 'Failed to fetch order',
      category: ErrorCategory.DATABASE,
      context: { orderId }
    });
    return null;
  }
};

/**
 * Add a new order
 */
export const addOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    // Add timestamp fields
    const orderWithTimestamps = {
      ...order,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'orders'), orderWithTimestamps);
    return docRef.id;
  } catch (error) {
    handleError(error, {
      message: 'Failed to add order',
      category: ErrorCategory.DATABASE,
      context: { order }
    });
    return null;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updated_at: Timestamp.now()
    });
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to update order status',
      category: ErrorCategory.DATABASE,
      context: { orderId, status }
    });
    return false;
  }
};

/**
 * Assign driver to order
 */
export const assignDriverToOrder = async (orderId: string, driverId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      driver_id: driverId,
      updated_at: Timestamp.now()
    });
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to assign driver to order',
      category: ErrorCategory.DATABASE,
      context: { orderId, driverId }
    });
    return false;
  }
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async () => {
  try {
    const ordersQuery = query(collection(db, 'orders'));
    const snapshot = await getDocs(ordersQuery);
    
    if (snapshot.empty) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      };
    }
    
    // Count orders by status
    let totalOrders = 0;
    let pendingOrders = 0;
    let preparingOrders = 0;
    let readyOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalOrders++;
      
      switch (data.status) {
        case 'pending':
          pendingOrders++;
          break;
        case 'preparing':
          preparingOrders++;
          break;
        case 'ready':
          readyOrders++;
          break;
        case 'delivered':
          deliveredOrders++;
          break;
        case 'cancelled':
          cancelledOrders++;
          break;
      }
    });
    
    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to get order statistics',
      category: ErrorCategory.DATABASE
    });
    
    return {
      totalOrders: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };
  }
};

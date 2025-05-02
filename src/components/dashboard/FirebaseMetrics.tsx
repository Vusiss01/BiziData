import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Utensils, ShoppingBag, Users, Clock, Database } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDataModelsCount, initializeDefaultDataModels } from '@/services/dataModelService';
import { initializeAllSampleData } from '@/services/sampleDataService';

const FirebaseMetrics = () => {
  // Get start of today for filtering today's orders
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Get last month's date for comparison
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Initialize sample data if none exists
  useEffect(() => {
    // First initialize data models
    initializeDefaultDataModels()
      .then(success => {
        if (success) {
          console.log('Data models initialized or already exist');
        }
      })
      .catch(error => {
        console.error('Failed to initialize data models:', error);
      });

    // Then initialize sample restaurants, orders, and users
    initializeAllSampleData()
      .then(success => {
        if (success) {
          console.log('Sample data initialized or already exists');
        }
      })
      .catch(error => {
        console.error('Failed to initialize sample data:', error);
      });
  }, []);

  // Query for active restaurants
  const { data: activeRestaurants, isLoading: isLoadingRestaurants, error: restaurantsError } = useQuery({
    queryKey: ['activeRestaurants'],
    refetchInterval: 5000, // Refetch every 5 seconds to ensure we get fresh data
    queryFn: async () => {
      try {
        console.log('Fetching active restaurants from Firebase');

        // Create query for active restaurants
        const restaurantsQuery = query(
          collection(db, 'restaurants'),
          where('status', '==', 'active')
        );

        // Execute query
        const snapshot = await getDocs(restaurantsQuery);
        const count = snapshot.docs.length;

        console.log(`Found ${count} active restaurants`);

        // For historical comparison, we'll use a simpler approach
        // since compound queries require composite indexes
        const allRestaurantsQuery = query(
          collection(db, 'restaurants')
        );

        const allSnapshot = await getDocs(allRestaurantsQuery);

        // Filter restaurants created before one month ago manually
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthAgoTimestamp = Timestamp.fromDate(oneMonthAgo);

        // Count active restaurants from last month
        let historicalCount = 0;
        allSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'active' &&
              data.created_at &&
              data.created_at instanceof Timestamp &&
              data.created_at.toMillis() <= oneMonthAgoTimestamp.toMillis()) {
            historicalCount++;
          }
        });

        console.log(`Found ${historicalCount} active restaurants from last month`);

        // Calculate percentage change
        const percentChange = historicalCount > 0
          ? Math.round(((count - historicalCount) / historicalCount) * 100)
          : 0;

        return {
          count: count || 0,
          percentChange: percentChange
        };
      } catch (error) {
        console.error('Error fetching active restaurants:', error);
        return {
          count: 0,
          percentChange: 0
        };
      }
    },
  });

  // Query for today's orders
  const { data: todayOrders, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['todayOrders'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      try {
        console.log('Fetching today\'s orders from Firebase');

        // Create query for today's orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('created_at', '>=', Timestamp.fromDate(startOfDay))
        );

        // Execute query
        const snapshot = await getDocs(ordersQuery);
        const count = snapshot.docs.length;

        console.log(`Found ${count} orders today`);

        return {
          count: count || 0
        };
      } catch (error) {
        console.error('Error fetching today\'s orders:', error);
        return {
          count: 0
        };
      }
    },
  });

  // Query for active users
  const { data: activeUsers, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['activeUsers'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      try {
        console.log('Fetching active users from Firebase');

        // Create query for all users
        const usersQuery = query(
          collection(db, 'users')
        );

        // Execute query
        const snapshot = await getDocs(usersQuery);
        const count = snapshot.docs.length;

        console.log(`Found ${count} users`);

        // For historical comparison, we'll use a simpler approach
        // Filter users created before one month ago manually
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthAgoTimestamp = Timestamp.fromDate(oneMonthAgo);

        // Count users from last month
        let historicalCount = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.created_at &&
              data.created_at instanceof Timestamp &&
              data.created_at.toMillis() <= oneMonthAgoTimestamp.toMillis()) {
            historicalCount++;
          }
        });

        console.log(`Found ${historicalCount} users from last month`);

        // Calculate percentage change
        const percentChange = historicalCount > 0
          ? Math.round(((count - historicalCount) / historicalCount) * 100)
          : 0;

        return {
          count: count || 0,
          percentChange: percentChange
        };
      } catch (error) {
        console.error('Error fetching active users:', error);
        return {
          count: 0,
          percentChange: 0
        };
      }
    },
  });

  // Query for data models
  const { data: dataModels, isLoading: isLoadingDataModels, error: dataModelsError } = useQuery({
    queryKey: ['dataModelsCount'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      try {
        console.log('Fetching data models count from Firebase');

        // Get count of data models
        const count = await getDataModelsCount();

        console.log(`Found ${count} data models`);

        return {
          count: count || 0,
          label: 'Active schemas'
        };
      } catch (error) {
        console.error('Error fetching data models:', error);
        return {
          count: 0,
          label: 'Active schemas'
        };
      }
    },
  });

  // Query for average delivery time
  const { data: deliveryTime, isLoading: isLoadingDelivery, error: deliveryError } = useQuery({
    queryKey: ['deliveryTime'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      try {
        console.log('Fetching delivery time data from Firebase');

        // Query for all orders
        const ordersQuery = query(
          collection(db, 'orders')
        );

        // Execute query
        const snapshot = await getDocs(ordersQuery);

        console.log(`Found ${snapshot.docs.length} total orders`);

        // Calculate average delivery time for completed orders
        let totalDeliveryTime = 0;
        let orderCount = 0;

        // Also track historical data
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthAgoTimestamp = Timestamp.fromDate(oneMonthAgo);

        let historicalTotalTime = 0;
        let historicalCount = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();

          // Only consider completed orders with delivery time
          if (data.status === 'completed' && data.delivery_time) {
            // Current period data
            totalDeliveryTime += data.delivery_time;
            orderCount++;

            // Historical data
            if (data.created_at &&
                data.created_at instanceof Timestamp &&
                data.created_at.toMillis() <= oneMonthAgoTimestamp.toMillis()) {
              historicalTotalTime += data.delivery_time;
              historicalCount++;
            }
          }
        });

        console.log(`Found ${orderCount} completed orders with delivery time`);
        console.log(`Found ${historicalCount} historical completed orders with delivery time`);

        const avgMinutes = orderCount > 0
          ? Math.round(totalDeliveryTime / orderCount)
          : 28; // Default if no data

        const historicalAvg = historicalCount > 0
          ? Math.round(historicalTotalTime / historicalCount)
          : avgMinutes;

        // Calculate percentage change (negative means faster/better)
        const percentChange = historicalAvg > 0
          ? Math.round(((avgMinutes - historicalAvg) / historicalAvg) * 100)
          : 0;

        return {
          avgMinutes: avgMinutes,
          percentChange: percentChange
        };
      } catch (error) {
        console.error('Error fetching delivery time:', error);
        return {
          avgMinutes: 28,
          percentChange: 0
        };
      }
    },
  });

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Active Restaurants Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Active Restaurants
          </CardTitle>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingRestaurants ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : restaurantsError ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">Error loading data</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatNumber(activeRestaurants?.count || 0)}
              </div>
              {activeRestaurants?.percentChange !== 0 ? (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  {activeRestaurants?.percentChange > 0 ? '+' : ''}{activeRestaurants?.percentChange}% from last month
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  No change from last month
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Today's Orders Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Today's Orders
          </CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : ordersError ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">Error loading data</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {todayOrders?.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Updated just now
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Models Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Data Models
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingDataModels ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : dataModelsError ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">Error loading data</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {dataModels?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dataModels?.label || 'Active schemas'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Active Users
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : usersError ? (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">Error loading data</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatNumber(activeUsers?.count || 0)}
              </div>
              {activeUsers?.percentChange !== 0 ? (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  {activeUsers?.percentChange > 0 ? '+' : ''}{activeUsers?.percentChange}% from last month
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  No change from last month
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseMetrics;

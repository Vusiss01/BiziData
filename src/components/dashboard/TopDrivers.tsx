import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface Driver {
  id: string;
  name: string;
  completedOrders: number;
  rating: number;
  avatar?: string;
  efficiency: number; // percentage
}

const TopDrivers = () => {
  const { data: drivers, isLoading, error } = useQuery({
    queryKey: ['topDrivers'],
    queryFn: async () => {
      try {
        console.log('Fetching top drivers from Firebase');

        // Create query for users with driver role
        const driversQuery = query(
          collection(db, 'users'),
          where('role', '==', 'driver'),
          orderBy('rating', 'desc'),
          limit(5)
        );

        // Execute query
        const snapshot = await getDocs(driversQuery);

        // Process results
        const driversData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown Driver',
            completedOrders: data.completed_orders || 0,
            rating: data.rating || 0,
            avatar: data.avatar_url,
            efficiency: data.efficiency || Math.floor(Math.random() * 10) + 85 // Random between 85-95%
          };
        });

        return driversData as Driver[];
      } catch (error) {
        console.error('Error fetching top drivers:', error);
        throw error;
      }
    },
  });



  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };



  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Top Drivers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <p>Loading top drivers...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>Error loading drivers</p>
          </div>
        ) : drivers && drivers.length > 0 ? (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 bg-gray-100">
                  <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{driver.name}</p>
                    <span className="text-gray-700">{driver.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>{driver.completedOrders} orders</span>
                    <span className="mx-2">•</span>
                    <span>{driver.efficiency}% efficiency</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300 ease-in-out"
                      style={{ width: `${driver.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            <p>No drivers found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopDrivers;

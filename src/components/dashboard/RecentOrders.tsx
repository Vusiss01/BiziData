import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { convertTimestamps } from '@/services/databaseService';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: Date;
  restaurant_name?: string;
}

const RecentOrders = () => {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      try {
        console.log('Fetching recent orders from Firebase');

        // Create query to get 5 most recent orders
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('created_at', 'desc'),
          limit(5)
        );

        // Execute query
        const snapshot = await getDocs(ordersQuery);

        // Process results
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return convertTimestamps({
            id: doc.id,
            order_number: data.order_number || `ORD-${doc.id.substring(0, 4).toUpperCase()}`,
            customer_name: data.customer_name || 'Unknown Customer',
            total: data.total || 0,
            status: data.status || 'pending',
            created_at: data.created_at,
            restaurant_name: data.restaurant_name || 'Unknown Restaurant'
          });
        });

        return ordersData as Order[];
      } catch (error) {
        console.error('Error fetching recent orders:', error);
        throw error;
      }
    },
  });



  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <p>Loading recent orders...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>Error loading orders</p>
          </div>
        ) : orders && orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.restaurant_name}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-4 text-gray-500">
            <p>No recent orders found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;

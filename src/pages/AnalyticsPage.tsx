import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Download, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mock chart component - in a real app, you would use a charting library like recharts
const ChartPlaceholder = ({ title, height = 300 }: { title: string; height?: number }) => (
  <div 
    className="bg-gray-50 rounded-md flex items-center justify-center" 
    style={{ height: `${height}px` }}
  >
    <div className="text-center">
      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-gray-500">{title}</p>
    </div>
  </div>
);

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topRestaurants: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    orders: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
}

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState("week");

  // Fetch analytics data from Firebase
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: async () => {
      try {
        console.log("Fetching analytics data from Firebase");
        
        // In a real app, you would have a more sophisticated analytics system
        // This is a simplified example that just counts orders and calculates revenue
        
        // Get orders
        const ordersQuery = query(
          collection(db, "orders"),
          orderBy("created_at", "desc")
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        
        if (ordersSnapshot.empty) {
          console.log("No orders found");
          return {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            topRestaurants: [],
            ordersByDay: [],
            revenueByDay: []
          };
        }
        
        // Process orders
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.() || doc.data().created_at
        }));
        
        // Calculate total orders and revenue
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Get top restaurants
        const restaurantMap = new Map();
        orders.forEach(order => {
          if (!order.restaurant_id) return;
          
          if (!restaurantMap.has(order.restaurant_id)) {
            restaurantMap.set(order.restaurant_id, {
              id: order.restaurant_id,
              name: order.restaurant_name || "Unknown Restaurant",
              orders: 0,
              revenue: 0
            });
          }
          
          const restaurantData = restaurantMap.get(order.restaurant_id);
          restaurantData.orders += 1;
          restaurantData.revenue += order.total || 0;
        });
        
        const topRestaurants = Array.from(restaurantMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        // Calculate orders and revenue by day
        const ordersByDayMap = new Map();
        const revenueByDayMap = new Map();
        
        orders.forEach(order => {
          if (!order.created_at) return;
          
          const date = order.created_at instanceof Date 
            ? order.created_at.toISOString().split('T')[0]
            : new Date(order.created_at).toISOString().split('T')[0];
          
          if (!ordersByDayMap.has(date)) {
            ordersByDayMap.set(date, 0);
            revenueByDayMap.set(date, 0);
          }
          
          ordersByDayMap.set(date, ordersByDayMap.get(date) + 1);
          revenueByDayMap.set(date, revenueByDayMap.get(date) + (order.total || 0));
        });
        
        const ordersByDay = Array.from(ordersByDayMap.entries())
          .map(([date, orders]) => ({ date, orders }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        const revenueByDay = Array.from(revenueByDayMap.entries())
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        return {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          topRestaurants,
          ordersByDay,
          revenueByDay
        };
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        throw err;
      }
    },
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Date Range
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <Tabs defaultValue="week" className="w-full" onValueChange={setDateRange}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
          <p>Loading analytics data...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-12 text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <div>
            <p className="font-semibold">Error loading analytics</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.totalOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData?.totalRevenue || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData?.averageOrderValue || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.ordersByDay && analyticsData.ordersByDay.length > 0 ? (
                  <ChartPlaceholder title="Orders Chart" />
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <p>No order data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.revenueByDay && analyticsData.revenueByDay.length > 0 ? (
                  <ChartPlaceholder title="Revenue Chart" />
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <p>No revenue data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Restaurants */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData?.topRestaurants && analyticsData.topRestaurants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Restaurant</th>
                        <th className="text-right py-3 px-4">Orders</th>
                        <th className="text-right py-3 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topRestaurants.map((restaurant) => (
                        <tr key={restaurant.id} className="border-b">
                          <td className="py-3 px-4">{restaurant.name}</td>
                          <td className="text-right py-3 px-4">{restaurant.orders}</td>
                          <td className="text-right py-3 px-4">
                            {formatCurrency(restaurant.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>No restaurant data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;

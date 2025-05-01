import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import FirebaseMetrics from '@/components/dashboard/FirebaseMetrics';
import RecentOrders from '@/components/dashboard/RecentOrders';
import RecentRestaurants from '@/components/dashboard/RecentRestaurants';
import TopDrivers from '@/components/dashboard/TopDrivers';
import { useQueryClient } from '@tanstack/react-query';

const DashboardPage = () => {
  const queryClient = useQueryClient();

  const refreshData = () => {
    // Invalidate and refetch all queries
    queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <FirebaseMetrics />

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentOrders />
            <div className="grid grid-cols-1 gap-6">
              <RecentRestaurants />
              <TopDrivers />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Analytics content will be added soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Reports content will be added soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Notifications content will be added soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;

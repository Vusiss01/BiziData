import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { DriverLocation, getActiveDriverLocations } from '@/services/trackingService';
import { useQuery } from '@tanstack/react-query';

const DriverLocationMap = () => {
  // Use React Query to fetch driver locations
  const {
    data: drivers = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['driverLocations'],
    queryFn: getActiveDriverLocations,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Helper function to convert Timestamp to Date if needed
  const getDateFromTimestamp = (timestamp: Date | Timestamp): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    // Convert Firestore Timestamp to Date
    return timestamp.toDate();
  };



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'en route':
        return 'bg-blue-100 text-blue-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      case 'picking up':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          Driver Locations
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>Error loading driver locations</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-2" />
            <p>Loading driver locations...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <MapPin className="h-12 w-12 mb-2 text-gray-300" />
            <p className="font-medium">No active drivers</p>
            <p className="text-sm">There are no drivers currently active</p>
          </div>
        ) : (
          <div>
            {/* Map placeholder - in a real app, this would be an actual map component */}
            <div className="bg-gray-100 rounded-md h-[300px] mb-4 flex items-center justify-center">
              <p className="text-gray-500">Map view would be displayed here</p>
            </div>

            <div className="space-y-3 mt-4">
              <h3 className="text-sm font-medium">Active Drivers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-start p-3 border rounded-md"
                  >
                    <MapPin className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-sm">{driver.name}</h4>
                        <Badge className={`ml-2 text-xs ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {driver.location.address} • {driver.vehicle}
                      </p>
                      {driver.currentOrder && (
                        <p className="text-xs text-gray-700 mt-1">
                          Order: {driver.currentOrder}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverLocationMap;

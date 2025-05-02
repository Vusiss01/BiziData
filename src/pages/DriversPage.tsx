import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Car, MapPin, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddDriverForm from "@/components/users/AddDriverForm";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getAllDrivers, DriverDetails } from "@/services/driverService";

const DriversPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();

  // Fetch drivers from Firebase using React Query
  const {
    data: drivers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: getAllDrivers,
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
  });

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.currentLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Manual refresh triggered');
              refetch();
            }}
          >
            Refresh List
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search drivers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
              <p>Loading drivers...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-8 text-red-500">
              <AlertCircle className="h-8 w-8 mr-2" />
              <div>
                <p className="font-medium">Error loading drivers</p>
                <p className="text-sm">Please try again later</p>
              </div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-8 text-gray-500">
              <Car className="h-12 w-12 mb-2 text-gray-300" />
              <p className="font-medium">No drivers found</p>
              <p className="text-sm">Add a driver to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {driver.avatarUrl ? (
                            <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                          ) : (
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} />
                          )}
                          <AvatarFallback>
                            <Car className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-xs text-gray-500">{driver.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={driver.status === "active" ? "default" : "secondary"}
                        className={
                          driver.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {driver.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-sm">{driver.currentLocation}</span>
                      </div>
                    </TableCell>
                    <TableCell>{driver.vehicleType}</TableCell>
                    <TableCell>{driver.completedOrders}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{driver.rating}</span>
                        <span className="text-yellow-500 ml-1">★</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden">
          <AddDriverForm
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={() => {
              console.log('Driver added successfully, refreshing list...');
              // Force invalidate the query cache and refetch
              setTimeout(() => {
                refetch();
              }, 1000); // Add a small delay to ensure Firestore has time to update
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriversPage;

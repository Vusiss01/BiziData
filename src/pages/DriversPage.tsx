import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Car, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const DriversPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for drivers
  const drivers = [
    {
      id: "1",
      name: "David Chen",
      email: "david.c@example.com",
      phone: "555-123-4567",
      status: "active",
      currentLocation: "Downtown",
      completedOrders: 128,
      rating: 4.8,
      vehicleType: "Car",
    },
    {
      id: "2",
      name: "Maria Rodriguez",
      email: "maria.r@example.com",
      phone: "555-234-5678",
      status: "active",
      currentLocation: "Uptown",
      completedOrders: 95,
      rating: 4.7,
      vehicleType: "Scooter",
    },
    {
      id: "3",
      name: "James Wilson",
      email: "james.w@example.com",
      phone: "555-345-6789",
      status: "inactive",
      currentLocation: "Midtown",
      completedOrders: 67,
      rating: 4.5,
      vehicleType: "Bicycle",
    },
    {
      id: "4",
      name: "Aisha Patel",
      email: "aisha.p@example.com",
      phone: "555-456-7890",
      status: "active",
      currentLocation: "West End",
      completedOrders: 112,
      rating: 4.9,
      vehicleType: "Car",
    },
  ];

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
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
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
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`} />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default DriversPage;

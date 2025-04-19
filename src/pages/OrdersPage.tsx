import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

interface Order {
  id: string;
  restaurant: string;
  restaurantLogo?: string;
  customer: string;
  items: number;
  total: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  date: string;
  time: string;
}

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const orders: Order[] = [
    {
      id: "ORD-1234",
      restaurant: "Pizza Palace",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=PP",
      customer: "John Smith",
      items: 3,
      total: 42.5,
      status: "delivered",
      date: "2023-06-15",
      time: "12:30 PM",
    },
    {
      id: "ORD-1235",
      restaurant: "Burger Bonanza",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=BB",
      customer: "Sarah Johnson",
      items: 2,
      total: 25.99,
      status: "preparing",
      date: "2023-06-15",
      time: "1:45 PM",
    },
    {
      id: "ORD-1236",
      restaurant: "Sushi Supreme",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SS",
      customer: "David Chen",
      items: 5,
      total: 68.75,
      status: "pending",
      date: "2023-06-15",
      time: "2:15 PM",
    },
    {
      id: "ORD-1237",
      restaurant: "Taco Time",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=TT",
      customer: "Maria Garcia",
      items: 4,
      total: 32.5,
      status: "ready",
      date: "2023-06-15",
      time: "3:00 PM",
    },
    {
      id: "ORD-1238",
      restaurant: "Pasta Paradise",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=PP2",
      customer: "James Wilson",
      items: 2,
      total: 29.99,
      status: "cancelled",
      date: "2023-06-15",
      time: "3:30 PM",
    },
    {
      id: "ORD-1239",
      restaurant: "Pizza Palace",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=PP",
      customer: "Emily Brown",
      items: 1,
      total: 15.99,
      status: "delivered",
      date: "2023-06-14",
      time: "7:45 PM",
    },
    {
      id: "ORD-1240",
      restaurant: "Burger Bonanza",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=BB",
      customer: "Michael Taylor",
      items: 3,
      total: 34.5,
      status: "delivered",
      date: "2023-06-14",
      time: "6:30 PM",
    },
    {
      id: "ORD-1241",
      restaurant: "Sushi Supreme",
      restaurantLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SS",
      customer: "Jessica Martinez",
      items: 4,
      total: 52.75,
      status: "delivered",
      date: "2023-06-14",
      time: "8:15 PM",
    },
  ];

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(`${a.date} ${a.time}`).getTime();
        const dateB = new Date(`${b.date} ${b.time}`).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "total") {
        return sortOrder === "asc" ? a.total - b.total : b.total - a.total;
      } else if (sortBy === "restaurant") {
        return sortOrder === "asc"
          ? a.restaurant.localeCompare(b.restaurant)
          : b.restaurant.localeCompare(a.restaurant);
      }
      return 0;
    });

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "preparing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Preparing
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Ready
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const preparingOrders = orders.filter((o) => o.status === "preparing").length;
  const readyOrders = orders.filter((o) => o.status === "ready").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Filter by Date
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            Export Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {preparingOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ready/Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {readyOrders + deliveredOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cancelledOrders}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Order Management</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    <Filter className="h-4 w-4 mr-1" />
                    {statusFilter === "all"
                      ? "All Status"
                      : statusFilter.charAt(0).toUpperCase() +
                        statusFilter.slice(1)}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("preparing")}
                  >
                    Preparing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("ready")}>
                    Ready
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("delivered")}
                  >
                    Delivered
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("cancelled")}
                  >
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("restaurant")}
                  >
                    <div className="flex items-center">
                      Restaurant
                      {sortBy === "restaurant" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("total")}
                  >
                    <div className="flex items-center">
                      Total
                      {sortBy === "total" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center">
                      Date/Time
                      {sortBy === "date" && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {order.restaurantLogo ? (
                              <AvatarImage
                                src={order.restaurantLogo}
                                alt={order.restaurant}
                              />
                            ) : (
                              <AvatarFallback>
                                {order.restaurant.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{order.restaurant}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.items} items</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{order.date}</span>
                          <span className="text-xs text-gray-500">
                            {order.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;

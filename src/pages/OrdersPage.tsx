import React, { useState, useEffect } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders, getOrderStatistics, OrderSummary } from "@/services/orderService";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch orders from Firebase using React Query
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError
  } = useQuery({
    queryKey: ['orders'],
    queryFn: getAllOrders
  });

  // Fetch order statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['orderStats'],
    queryFn: getOrderStatistics
  });

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

  // Use statistics from the query or calculate from orders if not available
  const totalOrders = stats?.totalOrders || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const preparingOrders = stats?.preparingOrders || 0;
  const readyOrders = stats?.readyOrders || 0;
  const deliveredOrders = stats?.deliveredOrders || 0;
  const cancelledOrders = stats?.cancelledOrders || 0;

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
            {statsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{totalOrders}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {pendingOrders}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {preparingOrders}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ready/Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {readyOrders + deliveredOrders}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {cancelledOrders}
              </div>
            )}
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
            {ordersLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
                <p>Loading orders...</p>
              </div>
            ) : ordersError ? (
              <div className="flex justify-center items-center p-8 text-red-500">
                <AlertCircle className="h-8 w-8 mr-2" />
                <div>
                  <p className="font-medium">Error loading orders</p>
                  <p className="text-sm">Please try again later</p>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Search, Plus, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  restaurant_id: string;
  restaurant_name: string;
  image_url?: string;
  available: boolean;
  created_at: any;
}

const MenuItemsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch menu items from Firebase
  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: ["menuItems", categoryFilter],
    queryFn: async () => {
      try {
        console.log("Fetching menu items from Firebase");
        
        // Create base query
        let menuItemsQuery = query(
          collection(db, "menu_items"),
          orderBy("created_at", "desc")
        );
        
        // Add category filter if not "all"
        if (categoryFilter !== "all") {
          menuItemsQuery = query(
            collection(db, "menu_items"),
            where("category", "==", categoryFilter),
            orderBy("created_at", "desc")
          );
        }
        
        // Execute query
        const snapshot = await getDocs(menuItemsQuery);
        
        console.log(`Query returned ${snapshot.docs.length} menu items`);
        
        // Process results
        const menuItemsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            restaurant_id: data.restaurant_id,
            restaurant_name: data.restaurant_name,
            image_url: data.image_url,
            available: data.available ?? true,
            created_at: data.created_at?.toDate?.() || data.created_at,
          };
        });
        
        return menuItemsData;
      } catch (err) {
        console.error("Error fetching menu items:", err);
        throw err;
      }
    },
  });

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search menu items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="border rounded-md px-3 py-2 bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="appetizer">Appetizers</option>
            <option value="main">Main Courses</option>
            <option value="dessert">Desserts</option>
            <option value="beverage">Beverages</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>All Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
              <p>Loading menu items...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-red-500">
              <AlertCircle className="h-8 w-8 mr-2" />
              <div>
                <p className="font-semibold">Error loading menu items</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No menu items found</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add your first menu item to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMenuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-md">
                            {item.image_url ? (
                              <AvatarImage
                                src={item.image_url}
                                alt={item.name}
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="rounded-md bg-orange-100 text-orange-800">
                                <Utensils className="h-5 w-5" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`
                            ${item.category === 'appetizer' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                            ${item.category === 'main' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : ''}
                            ${item.category === 'dessert' ? 'bg-pink-100 text-pink-800 hover:bg-pink-100' : ''}
                            ${item.category === 'beverage' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                          `}
                        >
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.restaurant_name || "Unknown Restaurant"}</TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.available
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuItemsPage;

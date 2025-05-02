import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Plus, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  restaurant_id: string;
  restaurant_name: string;
  min_quantity: number;
  created_at: any;
  updated_at: any;
}

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch inventory items from Firebase
  const { data: inventoryItems = [], isLoading, error } = useQuery({
    queryKey: ["inventoryItems", categoryFilter],
    queryFn: async () => {
      try {
        console.log("Fetching inventory items from Firebase");
        
        // Create base query
        let inventoryQuery = query(
          collection(db, "inventory"),
          orderBy("created_at", "desc")
        );
        
        // Add category filter if not "all"
        if (categoryFilter !== "all") {
          inventoryQuery = query(
            collection(db, "inventory"),
            where("category", "==", categoryFilter),
            orderBy("created_at", "desc")
          );
        }
        
        // Execute query
        const snapshot = await getDocs(inventoryQuery);
        
        console.log(`Query returned ${snapshot.docs.length} inventory items`);
        
        // Process results
        const inventoryData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            unit: data.unit,
            restaurant_id: data.restaurant_id,
            restaurant_name: data.restaurant_name,
            min_quantity: data.min_quantity || 0,
            created_at: data.created_at?.toDate?.() || data.created_at,
            updated_at: data.updated_at?.toDate?.() || data.updated_at,
          };
        });
        
        return inventoryData;
      } catch (err) {
        console.error("Error fetching inventory items:", err);
        throw err;
      }
    },
  });

  // Filter inventory items based on search query
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { status: "out-of-stock", label: "Out of Stock" };
    } else if (item.quantity < item.min_quantity) {
      return { status: "low", label: "Low Stock" };
    } else {
      return { status: "in-stock", label: "In Stock" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Inventory Item
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search inventory..."
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
            <option value="ingredients">Ingredients</option>
            <option value="packaging">Packaging</option>
            <option value="supplies">Supplies</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alert */}
      {inventoryItems.some(item => item.quantity < item.min_quantity) && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Low Stock Alert</h3>
            <p className="text-amber-700 text-sm mt-1">
              Some inventory items are below their minimum quantity threshold.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
              <p>Loading inventory items...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-red-500">
              <AlertCircle className="h-8 w-8 mr-2" />
              <div>
                <p className="font-semibold">Error loading inventory</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No inventory items found</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add your first inventory item to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.restaurant_name || "All Restaurants"}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`
                              ${stockStatus.status === 'in-stock' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                              ${stockStatus.status === 'low' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                              ${stockStatus.status === 'out-of-stock' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}
                            `}
                          >
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.updated_at instanceof Date
                            ? item.updated_at.toLocaleDateString()
                            : "Unknown"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage;

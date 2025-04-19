import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Database, Code, Copy, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useCollection } from "@/hooks/useDatabase";

const DataModelsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { data: savedSchemas, loading } = useCollection("schemas");

  const dataModels = [
    {
      id: "restaurant",
      name: "Restaurant Profile",
      description:
        "Core restaurant information including name, address, hours, and contact details",
      category: "core",
      fields: 12,
      usageCount: 842,
    },
    {
      id: "menu",
      name: "Menu Items",
      description:
        "Food and beverage items with prices, descriptions, categories, and images",
      category: "core",
      fields: 15,
      usageCount: 756,
    },
    {
      id: "orders",
      name: "Order Management",
      description:
        "Customer orders with items, quantities, prices, and status tracking",
      category: "core",
      fields: 18,
      usageCount: 621,
    },
    {
      id: "customers",
      name: "Customer Profiles",
      description:
        "Customer information including contact details, preferences, and order history",
      category: "extended",
      fields: 14,
      usageCount: 512,
    },
    {
      id: "delivery",
      name: "Delivery Tracking",
      description:
        "Delivery status, driver information, and real-time location tracking",
      category: "extended",
      fields: 16,
      usageCount: 498,
    },
    {
      id: "inventory",
      name: "Inventory Management",
      description: "Track ingredients, stock levels, and automatic reordering",
      category: "extended",
      fields: 20,
      usageCount: 423,
    },
    {
      id: "reviews",
      name: "Customer Reviews",
      description: "Ratings and feedback for restaurants and menu items",
      category: "optional",
      fields: 8,
      usageCount: 387,
    },
    {
      id: "loyalty",
      name: "Loyalty Program",
      description: "Points, rewards, and customer loyalty tracking",
      category: "optional",
      fields: 12,
      usageCount: 356,
    },
  ];

  const filteredModels = dataModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || model.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case "core":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Core
          </Badge>
        );
      case "extended":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Extended
          </Badge>
        );
      case "optional":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Optional
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Models</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate("/data-models/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Model
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Food Delivery Data Models</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="core">Core</TabsTrigger>
              <TabsTrigger value="extended">Extended</TabsTrigger>
              <TabsTrigger value="optional">Optional</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No data models found matching your search.
              </div>
            ) : (
              filteredModels.map((model) => (
                <Card
                  key={model.id}
                  className="overflow-hidden border-2 hover:border-orange-200 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-base">
                          {model.name}
                        </CardTitle>
                      </div>
                      {getCategoryBadge(model.category)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {model.description}
                    </p>
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>{model.fields} fields</span>
                      <span>{model.usageCount} apps using</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Code className="h-4 w-4 mr-1" />
                        Schema
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Copy className="h-4 w-4 mr-1" />
                        API
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schema Example</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-gray-50 font-mono text-sm">
            <pre>{`// Restaurant Schema
{
  "name": "string",
  "description": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "coordinates": {
      "latitude": "number",
      "longitude": "number"
    }
  },
  "contact": {
    "phone": "string",
    "email": "string",
    "website": "string"
  },
  "hours": [
    {
      "day": "string",
      "open": "string",
      "close": "string",
      "isClosed": "boolean"
    }
  ],
  "cuisine": ["string"],
  "priceRange": "number",
  "rating": "number",
  "features": {
    "delivery": "boolean",
    "takeout": "boolean",
    "dineIn": "boolean",
    "outdoor": "boolean",
    "creditCards": "boolean",
    "wifi": "boolean"
  },
  "images": ["string"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}`}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataModelsPage;

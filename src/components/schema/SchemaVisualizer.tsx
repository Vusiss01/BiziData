import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  Check,
  Code,
  Database,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface SchemaVisualizerProps {
  schema?: {
    name: string;
    description: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    relationships?: Array<{
      from: string;
      to: string;
      type: string;
      description: string;
    }>;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({
  isOpen = true,
  onClose = () => {},
  schema = {
    name: "Restaurant",
    description:
      "Core restaurant information including name, address, hours, and contact details",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the restaurant",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Name of the restaurant",
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Description of the restaurant",
      },
      {
        name: "address",
        type: "object",
        required: true,
        description: "Physical address of the restaurant",
      },
      {
        name: "contact",
        type: "object",
        required: true,
        description: "Contact information for the restaurant",
      },
      {
        name: "hours",
        type: "array",
        required: true,
        description: "Operating hours for each day of the week",
      },
      {
        name: "cuisine",
        type: "array",
        required: false,
        description: "Types of cuisine offered",
      },
      {
        name: "priceRange",
        type: "number",
        required: false,
        description: "Price range indicator (1-4)",
      },
      {
        name: "rating",
        type: "number",
        required: false,
        description: "Average customer rating",
      },
      {
        name: "features",
        type: "object",
        required: false,
        description: "Special features and amenities",
      },
      {
        name: "images",
        type: "array",
        required: false,
        description: "URLs to restaurant images",
      },
      {
        name: "createdAt",
        type: "timestamp",
        required: true,
        description: "When the record was created",
      },
      {
        name: "updatedAt",
        type: "timestamp",
        required: true,
        description: "When the record was last updated",
      },
    ],
    relationships: [
      {
        from: "Restaurant",
        to: "Menu",
        type: "one-to-many",
        description: "A restaurant has many menu items",
      },
      {
        from: "Restaurant",
        to: "Order",
        type: "one-to-many",
        description: "A restaurant has many orders",
      },
      {
        from: "Restaurant",
        to: "Review",
        type: "one-to-many",
        description: "A restaurant has many reviews",
      },
    ],
  },
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("schema");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSchemaCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSchemaCode = () => {
    // Generate JSON schema representation
    let schemaCode = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "${schema.name}",
  "description": "${schema.description}",
  "type": "object",
  "properties": {`;

    schema.fields.forEach((field, index) => {
      schemaCode += `
    "${field.name}": {
      "type": "${field.type}",
      "description": "${field.description}"
    }${index < schema.fields.length - 1 ? "," : ""}`;
    });

    schemaCode += `
  },
  "required": [${schema.fields
    .filter((field) => field.required)
    .map((field) => `"${field.name}"`)
    .join(", ")}]
}`;

    return schemaCode;
  };

  const generateApiCode = () => {
    // Generate sample API code
    return `// JavaScript SDK Example

// Initialize the FoodBase SDK
const foodbase = new FoodBase({
  apiKey: "YOUR_API_KEY"
});

// Create a new restaurant
const createRestaurant = async () => {
  try {
    const restaurant = await foodbase.restaurants.create({
      name: "Pizza Palace",
      description: "Best pizza in town",
      address: {
        street: "123 Main St",
        city: "Foodville",
        state: "CA",
        zipCode: "12345",
        country: "USA"
      },
      contact: {
        phone: "555-123-4567",
        email: "info@pizzapalace.com",
        website: "https://pizzapalace.com"
      },
      hours: [
        { day: "Monday", open: "11:00", close: "22:00" },
        { day: "Tuesday", open: "11:00", close: "22:00" },
        // ... other days
      ],
      cuisine: ["Italian", "Pizza"],
      priceRange: 2
    });
    
    console.log("Restaurant created:", restaurant.id);
    return restaurant;
  } catch (error) {
    console.error("Error creating restaurant:", error);
  }
};

// Query restaurants
const getRestaurants = async () => {
  try {
    const restaurants = await foodbase.restaurants
      .where("cuisine", "array-contains", "Pizza")
      .where("priceRange", "<=", 2)
      .limit(10)
      .get();
      
    restaurants.forEach(restaurant => {
      console.log(restaurant.name, restaurant.rating);
    });
  } catch (error) {
    console.error("Error querying restaurants:", error);
  }
};`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            {schema.name} Schema
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">{schema.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API Usage
            </TabsTrigger>
            <TabsTrigger
              value="relationships"
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Relationships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schema" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Field</th>
                      <th className="text-left py-2 px-3 font-medium">Type</th>
                      <th className="text-left py-2 px-3 font-medium">
                        Required
                      </th>
                      <th className="text-left py-2 px-3 font-medium">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schema.fields.map((field, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-3 font-medium">{field.name}</td>
                        <td className="py-2 px-3 text-gray-600">
                          {field.type}
                        </td>
                        <td className="py-2 px-3">
                          {field.required ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Required
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {field.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="relative">
                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-gray-50 font-mono text-sm">
                  <pre>{generateSchemaCode()}</pre>
                </ScrollArea>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-gray-50 font-mono text-sm">
                <pre>{generateApiCode()}</pre>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  navigator.clipboard.writeText(generateApiCode());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="mt-4">
            {schema.relationships && schema.relationships.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">From</th>
                      <th className="text-left py-2 px-3 font-medium">To</th>
                      <th className="text-left py-2 px-3 font-medium">Type</th>
                      <th className="text-left py-2 px-3 font-medium">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schema.relationships.map((rel, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-3">{rel.from}</td>
                        <td className="py-2 px-3">{rel.to}</td>
                        <td className="py-2 px-3">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {rel.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {rel.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No relationships defined for this schema.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            Implement Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchemaVisualizer;

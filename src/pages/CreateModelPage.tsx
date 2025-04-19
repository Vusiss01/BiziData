import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchemaBuilder from "@/components/schema/SchemaBuilder";
import SchemaVisualizer from "@/components/schema/SchemaVisualizer";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Code, Eye } from "lucide-react";

const CreateModelPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("builder");
  const [schema, setSchema] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSchemaCreated = (newSchema: any) => {
    setSchema(newSchema);
    setPreviewMode(true);
  };

  const handleBackToBuilder = () => {
    setPreviewMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/data-models")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Data Model</h1>
        </div>
      </div>

      {previewMode && schema ? (
        <SchemaVisualizer schema={schema} onClose={handleBackToBuilder} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              New Data Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
                <TabsTrigger
                  value="builder"
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Schema Builder
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder">
                <SchemaBuilder onSave={handleSchemaCreated} />
              </TabsContent>

              <TabsContent value="templates">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Restaurant",
                      description:
                        "Core restaurant information including name, address, hours, and contact details",
                      fields: 12,
                    },
                    {
                      name: "Menu Item",
                      description:
                        "Food and beverage items with prices, descriptions, categories, and images",
                      fields: 15,
                    },
                    {
                      name: "Order",
                      description:
                        "Customer orders with items, quantities, prices, and status tracking",
                      fields: 18,
                    },
                    {
                      name: "Customer",
                      description:
                        "Customer information including contact details, preferences, and order history",
                      fields: 14,
                    },
                    {
                      name: "Delivery",
                      description:
                        "Delivery status, driver information, and real-time location tracking",
                      fields: 16,
                    },
                    {
                      name: "Inventory",
                      description:
                        "Track ingredients, stock levels, and automatic reordering",
                      fields: 20,
                    },
                  ].map((template, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden border-2 hover:border-orange-200 transition-colors cursor-pointer"
                      onClick={() => setActiveTab("builder")}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-base">
                              {template.name}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-gray-600 mb-4">
                          {template.description}
                        </p>
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <span>{template.fields} fields</span>
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateModelPage;

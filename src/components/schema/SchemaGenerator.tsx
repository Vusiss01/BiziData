import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Copy, Check, Code, Database, Play, Save, Upload } from "lucide-react";

interface SchemaGeneratorProps {
  isOpen?: boolean;
  onClose?: () => void;
  schemaData?: {
    name: string;
    description: string;
    tables: Array<{
      name: string;
      description: string;
      columns: Array<{
        name: string;
        type: string;
        constraints: string[];
      }>;
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
      description: string;
    }>;
  };
}

const SchemaGenerator: React.FC<SchemaGeneratorProps> = ({
  isOpen = true,
  onClose = () => {},
  schemaData = {
    name: "E-commerce Database",
    description:
      "A schema for an e-commerce platform with users, products, orders, and reviews.",
    tables: [
      {
        name: "users",
        description: "Stores user account information",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "not null"],
          },
          {
            name: "email",
            type: "varchar(255)",
            constraints: ["unique", "not null"],
          },
          {
            name: "password_hash",
            type: "varchar(255)",
            constraints: ["not null"],
          },
          { name: "first_name", type: "varchar(100)", constraints: [] },
          { name: "last_name", type: "varchar(100)", constraints: [] },
          {
            name: "created_at",
            type: "timestamp",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "products",
        description: "Stores product information",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "not null"],
          },
          { name: "name", type: "varchar(255)", constraints: ["not null"] },
          { name: "description", type: "text", constraints: [] },
          { name: "price", type: "decimal(10,2)", constraints: ["not null"] },
          {
            name: "inventory_count",
            type: "integer",
            constraints: ["not null", "default 0"],
          },
          {
            name: "created_at",
            type: "timestamp",
            constraints: ["not null", "default now()"],
          },
        ],
      },
    ],
    relationships: [
      {
        from: "orders",
        to: "users",
        type: "many-to-one",
        description:
          "Each order belongs to one user, users can have many orders",
      },
      {
        from: "order_items",
        to: "products",
        type: "many-to-one",
        description:
          "Each order item references one product, products can be in many order items",
      },
    ],
  },
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  const handleCopyCode = () => {
    // In a real implementation, this would copy the SQL code to clipboard
    navigator.clipboard.writeText(generateSQLCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSQLCode = () => {
    // This is a simplified SQL generation function
    // In a real implementation, this would generate proper SQL based on the schema
    let sql = `-- SQL Schema for ${schemaData.name}\n`;
    sql += `-- ${schemaData.description}\n\n`;

    schemaData.tables.forEach((table) => {
      sql += `CREATE TABLE ${table.name} (\n`;

      table.columns.forEach((column, index) => {
        sql += `  ${column.name} ${column.type} ${column.constraints.join(" ")}${index < table.columns.length - 1 ? "," : ""}\n`;
      });

      sql += `);\n\n`;
    });

    return sql;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Schema Generator: {schemaData.name}
          </DialogTitle>
          <p className="text-gray-500 mt-1">{schemaData.description}</p>
        </DialogHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                SQL Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Tables</h3>
                <div className="space-y-6">
                  {schemaData.tables.map((table, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-md border shadow-sm"
                    >
                      <h4 className="text-md font-medium flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        {table.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {table.description}
                      </p>

                      <div className="mt-3">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium">
                                Column
                              </th>
                              <th className="text-left py-2 px-3 font-medium">
                                Type
                              </th>
                              <th className="text-left py-2 px-3 font-medium">
                                Constraints
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column, colIndex) => (
                              <tr key={colIndex} className="border-t">
                                <td className="py-2 px-3">{column.name}</td>
                                <td className="py-2 px-3 text-gray-600">
                                  {column.type}
                                </td>
                                <td className="py-2 px-3">
                                  {column.constraints.map((constraint, i) => (
                                    <span
                                      key={i}
                                      className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                    >
                                      {constraint}
                                    </span>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {schemaData.relationships.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Relationships
                    </h3>
                    <div className="bg-white p-4 rounded-md border shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium">
                              From
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              To
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Type
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {schemaData.relationships.map((rel, index) => (
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
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {generateSQLCode()}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
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
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-6 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Schema
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Deploy
            </Button>
            <Button className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Implement
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaGenerator;

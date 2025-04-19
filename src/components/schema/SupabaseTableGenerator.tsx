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
import {
  Copy,
  Check,
  Code,
  Database,
  Play,
  Save,
  Upload,
  Download,
  Table,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SupabaseDataManager from "./SupabaseDataManager";
import { ScrollArea } from "../ui/scroll-area";

interface TableColumn {
  name: string;
  type: string;
  constraints: string[];
}

interface Table {
  name: string;
  description: string;
  columns: TableColumn[];
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

interface SupabaseTableGeneratorProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SupabaseTableGenerator: React.FC<SupabaseTableGeneratorProps> = ({
  isOpen = true,
  onClose = () => {},
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [showDataManager, setShowDataManager] = useState(false);

  // Define the schema based on the provided requirements
  const schema = {
    name: "Delivery Platform Database",
    description:
      "A comprehensive schema for a delivery platform with multi-user roles and restaurant management",
    tables: [
      {
        name: "users",
        description:
          "Stores every user in the system—admins, owners, managers, cashiers, drivers, and customers",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "references auth.users"],
          },
          { name: "email", type: "text", constraints: ["not null", "unique"] },
          {
            name: "role",
            type: "text",
            constraints: [
              "not null",
              "check (role in ('admin', 'owner', 'store_manager', 'cashier', 'driver', 'customer'))",
            ],
          },
          { name: "name", type: "text", constraints: ["not null"] },
          { name: "phone", type: "text", constraints: [] },
          { name: "address", type: "text", constraints: [] },
          { name: "current_suburb", type: "text", constraints: [] },
          {
            name: "login_at",
            type: "timestamp with time zone",
            constraints: [],
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "regions",
        description: "Defines service areas for driver dispatch",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          { name: "name", type: "text", constraints: ["not null"] },
        ],
      },
      {
        name: "restaurants",
        description:
          "Core restaurant records, each owned by a user with role 'owner'",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "owner_id",
            type: "uuid",
            constraints: ["not null", "references users(id)"],
          },
          { name: "name", type: "text", constraints: ["not null"] },
          { name: "logo_url", type: "text", constraints: [] },
          { name: "cover_page_url", type: "text", constraints: [] },
          { name: "rating", type: "numeric", constraints: [] },
          {
            name: "status",
            type: "text",
            constraints: [
              "not null",
              "check (status in ('pending_verification', 'active', 'suspended'))",
            ],
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "restaurant_locations",
        description:
          "Multiple branches per restaurant with detailed address breakdown",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_id",
            type: "uuid",
            constraints: ["not null", "references restaurants(id)"],
          },
          { name: "suburb", type: "text", constraints: ["not null"] },
          { name: "street", type: "text", constraints: ["not null"] },
          { name: "city", type: "text", constraints: ["not null"] },
          { name: "town", type: "text", constraints: [] },
          { name: "latitude", type: "numeric", constraints: [] },
          { name: "longitude", type: "numeric", constraints: [] },
          {
            name: "status",
            type: "text",
            constraints: ["not null", "check (status in ('open', 'closed'))"],
          },
          { name: "rating", type: "numeric", constraints: [] },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "verification_documents",
        description:
          "Owners upload legal/docs for each restaurant; admins review",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_id",
            type: "uuid",
            constraints: ["not null", "references restaurants(id)"],
          },
          {
            name: "owner_id",
            type: "uuid",
            constraints: ["not null", "references users(id)"],
          },
          { name: "document_type", type: "text", constraints: ["not null"] },
          { name: "file_url", type: "text", constraints: ["not null"] },
          {
            name: "status",
            type: "text",
            constraints: [
              "not null",
              "check (status in ('pending', 'approved', 'rejected'))",
            ],
          },
          {
            name: "submitted_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "reviewed_at",
            type: "timestamp with time zone",
            constraints: [],
          },
          {
            name: "reviewed_by",
            type: "uuid",
            constraints: ["references users(id)"],
          },
        ],
      },
      {
        name: "driver_documents",
        description:
          "Drivers upload license and vehicle documents; admins verify",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "driver_id",
            type: "uuid",
            constraints: ["not null", "references users(id)"],
          },
          { name: "document_type", type: "text", constraints: ["not null"] },
          { name: "file_url", type: "text", constraints: ["not null"] },
          {
            name: "status",
            type: "text",
            constraints: [
              "not null",
              "check (status in ('pending', 'approved', 'rejected'))",
            ],
          },
          {
            name: "submitted_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "reviewed_at",
            type: "timestamp with time zone",
            constraints: [],
          },
          {
            name: "reviewed_by",
            type: "uuid",
            constraints: ["references users(id)"],
          },
        ],
      },
      {
        name: "menu_items",
        description: "Catalog of food/products per restaurant",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_id",
            type: "uuid",
            constraints: ["not null", "references restaurants(id)"],
          },
          { name: "name", type: "text", constraints: ["not null"] },
          { name: "description", type: "text", constraints: [] },
          { name: "price", type: "decimal", constraints: ["not null"] },
          { name: "image_url", type: "text", constraints: [] },
          { name: "category", type: "text", constraints: [] },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "discounts",
        description: "Time‑based promotions at the branch level",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_location_id",
            type: "uuid",
            constraints: ["not null", "references restaurant_locations(id)"],
          },
          { name: "percentage", type: "numeric", constraints: ["not null"] },
          { name: "start_date", type: "date", constraints: ["not null"] },
          { name: "end_date", type: "date", constraints: ["not null"] },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "delivery_info",
        description: "Delivery settings per branch (speed, ETA)",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_location_id",
            type: "uuid",
            constraints: ["not null", "references restaurant_locations(id)"],
          },
          { name: "speed", type: "numeric", constraints: [] },
          { name: "estimated_time", type: "text", constraints: [] },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "driver_queue",
        description:
          "Manages region‑based driver availability ordered by login time",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "driver_id",
            type: "uuid",
            constraints: ["not null", "references users(id)"],
          },
          {
            name: "region_id",
            type: "uuid",
            constraints: ["not null", "references regions(id)"],
          },
          {
            name: "login_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "status",
            type: "text",
            constraints: [
              "not null",
              "check (status in ('waiting', 'assigned', 'offline'))",
            ],
          },
        ],
      },
      {
        name: "orders",
        description:
          "Customer orders, linking restaurants, drivers, and customers",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "restaurant_location_id",
            type: "uuid",
            constraints: ["not null", "references restaurant_locations(id)"],
          },
          {
            name: "driver_id",
            type: "uuid",
            constraints: ["references users(id)"],
          },
          {
            name: "customer_id",
            type: "uuid",
            constraints: ["not null", "references users(id)"],
          },
          {
            name: "status",
            type: "text",
            constraints: [
              "not null",
              "check (status in ('pending', 'accepted', 'picked_up', 'delivered', 'cancelled'))",
            ],
          },
          { name: "total_amount", type: "numeric", constraints: ["not null"] },
          {
            name: "discount_id",
            type: "uuid",
            constraints: ["references discounts(id)"],
          },
          { name: "delivery_address", type: "text", constraints: ["not null"] },
          {
            name: "created_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            constraints: ["not null", "default now()"],
          },
        ],
      },
      {
        name: "order_items",
        description: "Line‑items within each order",
        columns: [
          {
            name: "id",
            type: "uuid",
            constraints: ["primary key", "default uuid_generate_v4()"],
          },
          {
            name: "order_id",
            type: "uuid",
            constraints: ["not null", "references orders(id)"],
          },
          {
            name: "menu_item_id",
            type: "uuid",
            constraints: ["not null", "references menu_items(id)"],
          },
          { name: "quantity", type: "integer", constraints: ["not null"] },
          { name: "unit_price", type: "numeric", constraints: ["not null"] },
        ],
      },
    ],
    relationships: [
      {
        from: "users",
        to: "restaurants",
        type: "one-to-many",
        description: "Each restaurant is owned by a user",
      },
      {
        from: "users",
        to: "verification_documents",
        type: "one-to-many",
        description: "Users upload verification documents",
      },
      {
        from: "users",
        to: "driver_documents",
        type: "one-to-many",
        description: "Drivers upload documents",
      },
      {
        from: "users",
        to: "driver_queue",
        type: "one-to-many",
        description: "Drivers join queues",
      },
      {
        from: "users",
        to: "orders",
        type: "one-to-many",
        description: "Users place orders",
      },
      {
        from: "regions",
        to: "driver_queue",
        type: "one-to-many",
        description: "Regions group drivers",
      },
      {
        from: "restaurants",
        to: "restaurant_locations",
        type: "one-to-many",
        description: "Restaurants have multiple locations",
      },
      {
        from: "restaurant_locations",
        to: "discounts",
        type: "one-to-many",
        description: "Locations define discounts",
      },
      {
        from: "restaurant_locations",
        to: "delivery_info",
        type: "one-to-many",
        description: "Locations configure delivery info",
      },
      {
        from: "restaurant_locations",
        to: "orders",
        type: "one-to-many",
        description: "Locations serve orders",
      },
      {
        from: "restaurants",
        to: "menu_items",
        type: "one-to-many",
        description: "Restaurants offer menu items",
      },
      {
        from: "orders",
        to: "order_items",
        type: "one-to-many",
        description: "Orders list items",
      },
      {
        from: "discounts",
        to: "orders",
        type: "one-to-many",
        description: "Discounts applied to orders",
      },
    ],
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSQLCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSQLCode = () => {
    let sql = `-- SQL Schema for ${schema.name}\n`;
    sql += `-- ${schema.description}\n\n`;

    // Enable UUID extension
    sql += `-- Enable UUID extension\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

    // Create tables
    schema.tables.forEach((table) => {
      sql += `-- ${table.description}\n`;
      sql += `CREATE TABLE ${table.name} (\n`;

      table.columns.forEach((column, index) => {
        sql += `  ${column.name} ${column.type}${column.constraints.length > 0 ? " " + column.constraints.join(" ") : ""}${index < table.columns.length - 1 ? "," : ""}\n`;
      });

      sql += `);\n\n`;
    });

    // Add RLS policies
    sql += `-- Enable Row Level Security\n`;
    schema.tables.forEach((table) => {
      sql += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n`;
    });
    sql += `\n`;

    // Add example RLS policies
    sql += `-- Example RLS Policies\n`;
    sql += `-- Users table policies\n`;
    sql += `CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (id = auth.uid());\n`;
    sql += `CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (id = auth.uid());\n`;
    sql += `CREATE POLICY "Admins have full access to users" ON users USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    sql += `-- Restaurants table policies\n`;
    sql += `CREATE POLICY "Public can view active restaurants" ON restaurants FOR SELECT USING (status = 'active');\n`;
    sql += `CREATE POLICY "Owners can manage their restaurants" ON restaurants USING (owner_id = auth.uid());\n`;
    sql += `CREATE POLICY "Admins have full access to restaurants" ON restaurants USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    sql += `-- Orders table policies\n`;
    sql += `CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (customer_id = auth.uid());\n`;
    sql += `CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());\n`;
    sql += `CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (driver_id = auth.uid());\n`;
    sql += `CREATE POLICY "Drivers can update order status" ON orders FOR UPDATE USING (driver_id = auth.uid());\n`;

    return sql;
  };

  const generateRLSPolicies = () => {
    let policies = `-- Row Level Security Policies\n\n`;

    // Users table policies
    policies += `-- Users table policies\n`;
    policies += `CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (id = auth.uid());\n`;
    policies += `CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (id = auth.uid());\n`;
    policies += `CREATE POLICY "Admins have full access to users" ON users USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    // Restaurants table policies
    policies += `-- Restaurants table policies\n`;
    policies += `CREATE POLICY "Public can view active restaurants" ON restaurants FOR SELECT USING (status = 'active');\n`;
    policies += `CREATE POLICY "Owners can manage their restaurants" ON restaurants USING (owner_id = auth.uid());\n`;
    policies += `CREATE POLICY "Admins have full access to restaurants" ON restaurants USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    // Restaurant locations policies
    policies += `-- Restaurant locations policies\n`;
    policies += `CREATE POLICY "Public can view restaurant locations" ON restaurant_locations FOR SELECT USING (TRUE);\n`;
    policies += `CREATE POLICY "Owners can manage their restaurant locations" ON restaurant_locations USING (\n  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_locations.restaurant_id AND restaurants.owner_id = auth.uid())\n);\n\n`;

    // Verification documents policies
    policies += `-- Verification documents policies\n`;
    policies += `CREATE POLICY "Owners can view their documents" ON verification_documents FOR SELECT USING (owner_id = auth.uid());\n`;
    policies += `CREATE POLICY "Owners can upload documents" ON verification_documents FOR INSERT WITH CHECK (owner_id = auth.uid());\n`;
    policies += `CREATE POLICY "Admins can review documents" ON verification_documents USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    // Driver documents policies
    policies += `-- Driver documents policies\n`;
    policies += `CREATE POLICY "Drivers can view their documents" ON driver_documents FOR SELECT USING (driver_id = auth.uid());\n`;
    policies += `CREATE POLICY "Drivers can upload documents" ON driver_documents FOR INSERT WITH CHECK (driver_id = auth.uid());\n`;
    policies += `CREATE POLICY "Admins can review driver documents" ON driver_documents USING (auth.jwt() ->> 'role' = 'admin');\n\n`;

    // Menu items policies
    policies += `-- Menu items policies\n`;
    policies += `CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT USING (TRUE);\n`;
    policies += `CREATE POLICY "Owners can manage their menu items" ON menu_items USING (\n  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.owner_id = auth.uid())\n);\n\n`;

    // Orders policies
    policies += `-- Orders table policies\n`;
    policies += `CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (customer_id = auth.uid());\n`;
    policies += `CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());\n`;
    policies += `CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (driver_id = auth.uid());\n`;
    policies += `CREATE POLICY "Drivers can update order status" ON orders FOR UPDATE USING (driver_id = auth.uid());\n`;
    policies += `CREATE POLICY "Restaurant owners can view their orders" ON orders USING (\n  EXISTS (\n    SELECT 1 FROM restaurants \n    JOIN restaurant_locations ON restaurants.id = restaurant_locations.restaurant_id \n    WHERE restaurant_locations.id = orders.restaurant_location_id AND restaurants.owner_id = auth.uid()\n  )\n);\n\n`;

    // Order items policies
    policies += `-- Order items policies\n`;
    policies += `CREATE POLICY "Users can view their order items" ON order_items USING (\n  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())\n);\n`;
    policies += `CREATE POLICY "Restaurant owners can view their order items" ON order_items USING (\n  EXISTS (\n    SELECT 1 FROM orders \n    JOIN restaurant_locations ON orders.restaurant_location_id = restaurant_locations.id \n    JOIN restaurants ON restaurant_locations.restaurant_id = restaurants.id \n    WHERE orders.id = order_items.order_id AND restaurants.owner_id = auth.uid()\n  )\n);\n`;

    return policies;
  };

  const generateStoragePolicies = () => {
    let policies = `-- Storage Bucket Policies\n\n`;

    policies += `-- Create storage buckets\n`;
    policies += `-- Run these in the SQL Editor:\n`;
    policies += `INSERT INTO storage.buckets (id, name) VALUES ('owner-docs', 'Owner Documents') ON CONFLICT DO NOTHING;\n`;
    policies += `INSERT INTO storage.buckets (id, name) VALUES ('driver-docs', 'Driver Documents') ON CONFLICT DO NOTHING;\n\n`;

    policies += `-- Owner documents storage policies\n`;
    policies += `CREATE POLICY "Owners can upload their documents" ON storage.objects \n`;
    policies += `  FOR INSERT WITH CHECK (\n`;
    policies += `    bucket_id = 'owner-docs' AND \n`;
    policies += `    (storage.foldername(name))[1] = auth.uid()::text\n`;
    policies += `  );\n\n`;

    policies += `CREATE POLICY "Owners can view their documents" ON storage.objects \n`;
    policies += `  FOR SELECT USING (\n`;
    policies += `    bucket_id = 'owner-docs' AND \n`;
    policies += `    (storage.foldername(name))[1] = auth.uid()::text\n`;
    policies += `  );\n\n`;

    policies += `CREATE POLICY "Admins can access all owner documents" ON storage.objects \n`;
    policies += `  USING (\n`;
    policies += `    bucket_id = 'owner-docs' AND \n`;
    policies += `    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'\n`;
    policies += `  );\n\n`;

    policies += `-- Driver documents storage policies\n`;
    policies += `CREATE POLICY "Drivers can upload their documents" ON storage.objects \n`;
    policies += `  FOR INSERT WITH CHECK (\n`;
    policies += `    bucket_id = 'driver-docs' AND \n`;
    policies += `    (storage.foldername(name))[1] = auth.uid()::text\n`;
    policies += `  );\n\n`;

    policies += `CREATE POLICY "Drivers can view their documents" ON storage.objects \n`;
    policies += `  FOR SELECT USING (\n`;
    policies += `    bucket_id = 'driver-docs' AND \n`;
    policies += `    (storage.foldername(name))[1] = auth.uid()::text\n`;
    policies += `  );\n\n`;

    policies += `CREATE POLICY "Admins can access all driver documents" ON storage.objects \n`;
    policies += `  USING (\n`;
    policies += `    bucket_id = 'driver-docs' AND \n`;
    policies += `    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'\n`;
    policies += `  );\n`;

    return policies;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Supabase Table Generator: {schema.name}
            </DialogTitle>
            <p className="text-gray-500 mt-1">{schema.description}</p>
          </DialogHeader>

          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Schema Preview
                </TabsTrigger>
                <TabsTrigger value="sql" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  SQL Code
                </TabsTrigger>
                <TabsTrigger value="rls" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  RLS Policies
                </TabsTrigger>
                <TabsTrigger
                  value="storage"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Storage Policies
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Manage Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Tables</h3>
                  <div className="space-y-6">
                    {schema.tables.map((table, index) => (
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

                  {schema.relationships.length > 0 && (
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
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sql" className="space-y-4">
                <div className="relative">
                  <ScrollArea className="h-[500px] w-full rounded-lg overflow-x-auto">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                      {generateSQLCode()}
                    </pre>
                  </ScrollArea>
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

              <TabsContent value="rls" className="space-y-4">
                <div className="relative">
                  <ScrollArea className="h-[500px] w-full rounded-lg overflow-x-auto">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                      {generateRLSPolicies()}
                    </pre>
                  </ScrollArea>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(generateRLSPolicies());
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

              <TabsContent value="storage" className="space-y-4">
                <div className="relative">
                  <ScrollArea className="h-[500px] w-full rounded-lg overflow-x-auto">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                      {generateStoragePolicies()}
                    </pre>
                  </ScrollArea>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(generateStoragePolicies());
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

              <TabsContent value="data" className="space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg border text-center">
                  <h3 className="text-lg font-medium mb-2">
                    Manage Your Supabase Data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect to your Supabase project to add, edit, or delete
                    data from your tables.
                  </p>
                  <Button
                    onClick={() => setShowDataManager(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Table className="h-4 w-4 mr-2" />
                    Open Data Manager
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
                <Download className="h-4 w-4" />
                Export SQL
              </Button>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4" />
                Deploy to Supabase
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Manager Modal */}
      {showDataManager && (
        <SupabaseDataManager
          isOpen={showDataManager}
          onClose={() => setShowDataManager(false)}
        />
      )}
    </>
  );
};

// Shield icon component
const Shield = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default SupabaseTableGenerator;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Utensils,
  Database,
  TrendingUp,
  Plus,
} from "lucide-react";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import DemoNotice from "@/components/common/DemoNotice";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(true);
  const { isDemoAccount } = useAuth();

  const handleCreateProject = (projectData: any) => {
    console.log("Creating project:", projectData);
    // Here you would typically make an API call to create the project
    setShowCreateProject(false);
  };

  return (
    <div className="space-y-6">
      {isDemoAccount && showDemoNotice && (
        <DemoNotice onClose={() => setShowDemoNotice(false)} />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FoodBase Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">API Documentation</Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setShowCreateProject(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Restaurants
            </CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Orders Processed
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42,567</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Models</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Active schemas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Data Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Restaurant Profile", users: 842, type: "Core" },
                { name: "Menu Items", users: 756, type: "Core" },
                { name: "Order Management", users: 621, type: "Core" },
                { name: "Customer Profiles", users: 512, type: "Extended" },
                { name: "Delivery Tracking", users: 498, type: "Extended" },
              ].map((model, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Database className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-gray-500">
                        {model.users} active users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {model.type}
                    </span>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/data-models">
                <Button variant="outline" className="w-full">
                  View All Data Models
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Pizza Palace", type: "Restaurant", date: "Today" },
                {
                  name: "Burger Bonanza",
                  type: "Restaurant",
                  date: "Yesterday",
                },
                {
                  name: "Sushi Supreme",
                  type: "Restaurant",
                  date: "2 days ago",
                },
                { name: "Taco Time", type: "Restaurant", date: "3 days ago" },
                {
                  name: "Pasta Paradise",
                  type: "Restaurant",
                  date: "4 days ago",
                },
              ].map((integration, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-gray-500">
                        {integration.type} • {integration.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/integrations">
                <Button variant="outline" className="w-full">
                  View All Integrations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSave={handleCreateProject}
      />
    </div>
  );
};

export default HomePage;

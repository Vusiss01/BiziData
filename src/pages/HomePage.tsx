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
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import DemoNotice from "@/components/common/DemoNotice";
import { useAuth } from "@/hooks/useAuth";
import FirebaseConnectionTest from "@/components/FirebaseConnectionTest";
import HomeMetrics from "@/components/dashboard/HomeMetrics";
import PopularDataModelsList from "@/components/dashboard/PopularDataModelsList";
import RecentShopsList from "@/components/dashboard/RecentShopsList";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// API Documentation URL
const API_DOCS_URL = "https://firebase.google.com/docs";

const HomePage = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(true);
  const { isDemoAccount } = useAuth();

  const handleCreateProject = (projectData: any) => {
    console.log("Creating project:", projectData);
    // Here you would typically make an API call to create the project
    setShowCreateProject(false);
  };

  const openApiDocs = () => {
    window.open(API_DOCS_URL, '_blank');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        {isDemoAccount && showDemoNotice && (
          <DemoNotice onClose={() => setShowDemoNotice(false)} />
        )}

        {/* Firebase Connection Test */}
        <FirebaseConnectionTest />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">FoodBase Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={openApiDocs}
              className="flex items-center gap-1"
            >
              API Documentation
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowCreateProject(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>

        {/* Metrics with React Query */}
        <HomeMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Data Models</CardTitle>
            </CardHeader>
            <CardContent>
              <PopularDataModelsList />
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
              <CardTitle>Recent Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentShopsList />
              <div className="mt-4">
                <Link to="/restaurants">
                  <Button variant="outline" className="w-full">
                    View All Restaurants
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
    </QueryClientProvider>
  );
};

export default HomePage;

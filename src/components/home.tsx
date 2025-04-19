import React from "react";
import StatisticsCards from "./dashboard/StatisticsCards";
import ActivityFeed from "./dashboard/ActivityFeed";
import HealthMonitor from "./dashboard/HealthMonitor";
import ProjectsTable from "./projects/ProjectsTable";
import AIChatAssistant from "./ai/AIChatAssistant";
import SchemaGenerator from "./schema/SchemaGenerator";
import { useState } from "react";

const Navbar = () => {
  return <div className="w-full h-16 bg-white border-b shadow-sm" />;
};

const Home = () => {
  const [showSchemaGenerator, setShowSchemaGenerator] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(true);

  const handleGenerateSchema = (schema: any) => {
    setShowSchemaGenerator(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="w-full">
          <StatisticsCards />
        </div>

        {/* Activity Feed and Health Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px]">
            <ActivityFeed />
          </div>
          <div className="h-[400px]">
            <HealthMonitor />
          </div>
        </div>

        {/* Projects Table */}
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
          <ProjectsTable
            onViewProject={(id) => console.log(`View project ${id}`)}
            onEditProject={(id) => console.log(`Edit project ${id}`)}
            onDeleteProject={(id) => console.log(`Delete project ${id}`)}
            onCreateProject={() => console.log("Create new project")}
          />
        </div>
      </div>

      {/* AI Chat Assistant */}
      {showChatAssistant && (
        <AIChatAssistant
          isOpen={showChatAssistant}
          onClose={() => setShowChatAssistant(false)}
          onGenerateSchema={handleGenerateSchema}
        />
      )}

      {/* Schema Generator Modal */}
      {showSchemaGenerator && (
        <SchemaGenerator
          isOpen={showSchemaGenerator}
          onClose={() => setShowSchemaGenerator(false)}
        />
      )}
    </div>
  );
};

export default Home;

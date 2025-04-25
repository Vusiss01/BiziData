import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AIChatAssistant from "@/components/ai/AIChatAssistant";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

const MainLayout = () => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Load the user profile data at the layout level
  // This ensures the data is available for all components
  const { profile, loading } = useUserProfile();

  // Simple loading indicator for debugging
  console.log("MainLayout - Profile loading:", loading, "Profile:", profile);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-2" />
                <p className="text-gray-500">Loading content...</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* AI Assistant */}
        {showAIAssistant && (
          <AIChatAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
          />
        )}

        {/* AI Assistant Toggle Button */}
        <Button
          className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 bg-orange-600 hover:bg-orange-700 shadow-lg"
          onClick={() => setShowAIAssistant(!showAIAssistant)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MainLayout;

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("ProtectedRoute - Loading timeout reached, forcing continue");
        setTimeoutReached(true);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // Debug logging
  useEffect(() => {
    console.log("ProtectedRoute - Auth loading:", loading, "User:", user ? "exists" : "null", "Timeout:", timeoutReached);
  }, [loading, user, timeoutReached]);

  // If still loading and timeout not reached, show loading screen
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  // If no user (or loading timed out without a user), redirect to login
  if (!user) {
    console.log("ProtectedRoute - No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render children
  console.log("ProtectedRoute - User authenticated, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;

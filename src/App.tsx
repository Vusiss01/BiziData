import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import routes from "tempo-routes";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import DataModelsPage from "./pages/DataModelsPage";
import OrdersPage from "./pages/OrdersPage";
import CreateModelPage from "./pages/CreateModelPage";
import ProfilePage from "./pages/ProfilePage";
import TestPage from "./pages/TestPage";
import RestaurantOwnersPage from "./pages/RestaurantOwnersPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantsPageSimple from "./pages/RestaurantsPageSimple";
import DriversPage from "./pages/DriversPage";
import DashboardPage from "./pages/DashboardPage";
import DebugPage from "./pages/DebugPage";
import UserManagementPage from "./pages/UserManagementPage";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";

import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/data-models" element={<DataModelsPage />} />
              <Route path="/data-models/create" element={<CreateModelPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/restaurant-owners" element={<RestaurantOwnersPage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/debug" element={<DebugPage />} />
            </Route>
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
      <Toaster />
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

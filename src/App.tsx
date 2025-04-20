import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import routes from "tempo-routes";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import DataModelsPage from "./pages/DataModelsPage";
import OrdersPage from "./pages/OrdersPage";
import CreateModelPage from "./pages/CreateModelPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
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
              <Route path="/" element={<HomePage />} />
              <Route path="/data-models" element={<DataModelsPage />} />
              <Route path="/data-models/create" element={<CreateModelPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

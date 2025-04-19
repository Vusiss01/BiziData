import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthForm from "./AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleDemoLogin = async () => {
    try {
      await login("demo@foodbase.com", "demo123");
      navigate("/");
    } catch (error) {
      console.error("Demo login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <div className="h-8 w-8 rounded-md bg-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to FoodBase
          </CardTitle>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <AuthForm type="login" />

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            onClick={handleDemoLogin}
          >
            Try Demo Account
          </Button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/signup" className="text-orange-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

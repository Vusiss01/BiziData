import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthForm from "./AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <div className="h-8 w-8 rounded-md bg-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Create an Account
          </CardTitle>
          <p className="text-gray-500 mt-1">
            Join FoodBase to manage your restaurant data
          </p>
        </CardHeader>
        <CardContent>
          <AuthForm type="signup" />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="text-orange-600 hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;

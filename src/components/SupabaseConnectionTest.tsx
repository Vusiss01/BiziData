import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "loading" | "connected" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [hasAnonKey, setHasAnonKey] = useState<boolean>(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check if environment variables are set
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setSupabaseUrl(url || "Not set");
        setHasAnonKey(!!key);

        if (!url || !key) {
          throw new Error("Supabase URL or anon key is not set in environment variables");
        }

        // Test a simple query to verify connection
        // First try to query the users table, which should exist in our schema
        const { data, error } = await supabase.from("users").select("*").limit(1);

        if (error) throw error;

        // If we get here, connection is successful
        setConnectionStatus("connected");
      } catch (error: any) {
        console.error("Supabase connection error:", error);
        setConnectionStatus("error");
        setErrorMessage(error.message || "Unknown error");
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Supabase Connection Status</h2>

      <div className="grid gap-2">
        <div>
          <strong>URL:</strong> {supabaseUrl}
        </div>
        <div>
          <strong>Anon Key:</strong> {hasAnonKey ? "Set ✓" : "Not set ✗"}
        </div>

        {connectionStatus === "loading" && (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Testing connection...
          </div>
        )}

        {connectionStatus === "connected" && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Connected Successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              Your application is properly connected to Supabase.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTitle className="text-red-800">Connection Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;

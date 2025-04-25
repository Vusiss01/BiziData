import { useState, useEffect } from 'react';
import { useAuth, getSupabaseClient } from './useAuth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  current_suburb?: string;
  created_at?: string;
  updated_at?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid initial loading state
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if no user is available
    if (!user) {
      console.log("No user available, skipping profile fetch");
      return;
    }

    console.log("Starting to fetch user profile for ID:", user.id);

    // Create a default profile from auth data
    const defaultProfile = {
      id: user.id,
      name: user.user_metadata?.name || "User",
      email: user.email || "",
      role: "admin", // Default role as requested
    };

    // Set loading state
    setLoading(true);

    // Function to fetch or create user profile
    const fetchOrCreateProfile = async () => {
      try {
        console.log("Querying users table for ID:", user.id);

        // Try direct query to the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Error querying users table:", userError);

          // If the user doesn't exist in the database, create them
          if (userError.code === 'PGRST116') { // Record not found
            console.log("User not found in database, creating user record...");

            // Create user record
            const { error: insertError } = await supabase
              .from("users")
              .insert({
                id: user.id,
                email: user.email || "",
                name: user.user_metadata?.name || "User",
                role: "admin", // Default role as requested
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error("Error creating user record:", insertError);
              // Use default profile on error
              setProfile(defaultProfile);
            } else {
              console.log("Successfully created user record");
              // Use the default profile since we just created it
              setProfile(defaultProfile);
            }
          } else {
            // For other errors, use default profile
            console.log("Using default profile due to query error");
            setProfile(defaultProfile);
          }
        } else if (userData) {
          // User found in database
          console.log("User found in database:", userData);
          setProfile(userData);
        } else {
          // If no data returned but no error either (unlikely)
          console.log("No user data returned, using default profile");
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Exception in useUserProfile:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Use default profile on error
        setProfile(defaultProfile);
      } finally {
        console.log("Profile fetch completed, setting loading to false");
        setLoading(false);
      }
    };

    // Execute the fetch/create function
    fetchOrCreateProfile();

    // Only depend on user.id to prevent unnecessary re-renders
  }, [user?.id]);

  return { profile, loading, error };
};

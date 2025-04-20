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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching user profile for ID:", user.id);

        // First try to get the profile from the database using RPC
        const { data, error } = await supabase
          .rpc('get_user_profile', { user_id: user.id });

        if (error) {
          console.error("Error querying users table:", error);
          // If RPC fails, try direct query
          const { data: directData, error: directError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (directError) {
            console.error("Direct query failed:", directError);
            // Fall back to auth metadata
            setProfile({
              id: user.id,
              name: user.user_metadata?.name || "",
              email: user.email,
              role: "admin", // Default role
            });
          } else if (directData) {
            setProfile(directData);
          }
        } else if (data) {
          setProfile(data);
        } else {
          // If no data returned, use default values from auth
          setProfile({
            id: user.id,
            name: user.user_metadata?.name || "",
            email: user.email,
            role: "admin", // Default role
          });
        }
      } catch (err) {
        console.error("Error in useUserProfile:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Still set basic profile from auth data
        setProfile({
          id: user.id,
          name: user.user_metadata?.name || "",
          email: user.email,
          role: "admin", // Default role
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, supabase]);

  return { profile, loading, error };
};

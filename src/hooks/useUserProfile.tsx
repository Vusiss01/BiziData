import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from '@/services/databaseService';
import * as authService from '@/services/authService';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  current_suburb?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if no user is available
    if (!user) {
      console.log("No user available, skipping profile fetch");
      return;
    }

    console.log("Starting to fetch user profile for ID:", user.id);
    setLoading(true);

    // Function to fetch or create user profile
    const fetchOrCreateProfile = async () => {
      try {
        // Get user profile from Firestore
        const { profile: userProfile, error: profileError } = await authService.getUserProfile(user.id);

        if (profileError) {
          throw profileError;
        }

        if (userProfile) {
          // Convert timestamps and set profile
          const processedProfile = convertTimestamps(userProfile) as UserProfile;
          setProfile(processedProfile);
        } else {
          // Create a default profile from auth data
          const defaultProfile: UserProfile = {
            id: user.id,
            name: user.displayName || "User",
            email: user.email || "",
            role: "admin", // Default role as requested
          };

          // Ensure user exists in Firestore
          await authService.ensureUserExists(user, 'admin');
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Exception in useUserProfile:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));

        // Create a default profile on error
        const defaultProfile: UserProfile = {
          id: user.id,
          name: user.displayName || "User",
          email: user.email || "",
          role: "admin", // Default role as requested
        };
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

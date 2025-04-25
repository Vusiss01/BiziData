import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser, AuthError } from "@supabase/supabase-js";
import { ensureCurrentUser } from "@/utils/userSync";

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Initialize user data with timeout
const initializeUserData = async () => {
  try {
    // Add a timeout to the operation
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('User data initialization timed out')), 5000)
    );

    // Use our new user synchronization utility with a timeout
    const syncPromise = ensureCurrentUser('admin');

    // Race between the actual operation and the timeout
    const userData = await Promise.race([
      syncPromise,
      timeoutPromise
    ]) as any;

    if (!userData) {
      console.error('Failed to initialize user data');
      return;
    }

    console.log('User data initialized successfully:', userData.id);
    return userData;
  } catch (error) {
    console.error('Error in initializeUserData:', error);
    // Continue even if there's an error - don't block the auth flow
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth - Setting up auth state listener");

    // Initial session check with timeout
    const checkUser = async () => {
      console.log("Auth - Checking initial session");
      setLoading(true);

      // Create a timeout promise
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log("Auth - Session check timed out, continuing as not logged in");
          setUser(null);
          setLoading(false);
          resolve();
        }, 3000); // 3 second timeout
      });

      // Create the actual check promise
      const checkPromise = (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            console.log("Auth - Initial session found, user is logged in");
            const currentUser = session.user as User;
            setUser(currentUser);

            // Initialize user data to ensure the user exists in the users table
            try {
              await initializeUserData();
            } catch (error) {
              console.error("Auth - Error initializing user data:", error);
            }
          } else {
            console.log("Auth - No initial session found, user is not logged in");
            setUser(null);
          }
        } catch (error) {
          console.error("Auth - Error checking session:", error);
          setUser(null);
        } finally {
          console.log("Auth - Initial session check complete");
          setLoading(false);
        }
      })();

      // Race between the timeout and the actual check
      await Promise.race([timeoutPromise, checkPromise]);
    };

    // Run the initial check
    checkUser();

    // Set up Supabase auth state listener with timeout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth - Auth state changed: ${event}`);
        setLoading(true);

        // Set a timeout to ensure loading state doesn't get stuck
        const timeoutId = setTimeout(() => {
          console.log("Auth - Auth state change handler timed out");
          if (session?.user) {
            const currentUser = session.user as User;
            setUser(currentUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, 3000); // 3 second timeout

        // Handle the auth state change
        (async () => {
          try {
            if (session?.user) {
              console.log("Auth - User is now logged in");
              const currentUser = session.user as User;
              setUser(currentUser);

              // Initialize user data to ensure the user exists in the users table
              if (event === 'SIGNED_IN') {
                try {
                  await initializeUserData();
                } catch (error) {
                  console.error("Auth - Error initializing user data on sign in:", error);
                }
              }
            } else {
              console.log("Auth - User is now logged out");
              setUser(null);
            }
          } catch (error) {
            console.error("Auth - Error in auth state change handler:", error);
          } finally {
            console.log("Auth - Auth state change handling complete");
            clearTimeout(timeoutId); // Clear the timeout if we complete normally
            setLoading(false);
          }
        })();
      }
    );

    return () => {
      console.log("Auth - Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Regular login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Initialize user data to ensure the user exists in the users table
    await initializeUserData();
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    // Create a record in the users table
    if (data.user) {
      // Use our new syncUser function to create the user record
      const { syncUser } = await import('@/utils/userSync');
      const userData = await syncUser(data.user.id, {
        email: data.user.email || email,
        name: name,
        role: 'admin' // Set as admin by default as requested
      });

      if (!userData) {
        console.error('Failed to create user record during signup');
      } else {
        console.log('User record created successfully during signup:', userData.id);
      }
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export the Supabase client for direct use
export const getSupabaseClient = () => supabase;

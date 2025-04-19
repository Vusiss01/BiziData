import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser, AuthError } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isDemoAccount: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Initialize demo data
const initializeDemoData = async () => {
  // Check if demo data already exists
  const { data: existingRestaurants } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1);

  if (existingRestaurants && existingRestaurants.length > 0) {
    console.log('Demo data already exists');
    return;
  }

  // Get the demo user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Insert the user into the users table with role 'admin'
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    role: 'admin',
    name: user.user_metadata.name || 'Demo User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  // Create demo regions
  const { data: region } = await supabase
    .from('regions')
    .insert({ name: 'Downtown' })
    .select('id')
    .single();

  if (!region) return;

  // Create demo restaurants
  const { data: restaurant1 } = await supabase
    .from('restaurants')
    .insert({
      owner_id: user.id,
      name: 'Pizza Palace',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (restaurant1) {
    // Create restaurant location
    const { data: location1 } = await supabase
      .from('restaurant_locations')
      .insert({
        restaurant_id: restaurant1.id,
        suburb: 'Downtown',
        street: '123 Main St',
        city: 'Foodville',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    // Create menu items
    if (location1) {
      await supabase.from('menu_items').insert([
        {
          restaurant_id: restaurant1.id,
          name: 'Margherita Pizza',
          description: 'Classic tomato and cheese',
          price: 12.99,
          category: 'Pizza',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          restaurant_id: restaurant1.id,
          name: 'Pepperoni Pizza',
          description: 'Loaded with pepperoni',
          price: 14.99,
          category: 'Pizza',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    }
  }

  // Create another restaurant
  const { data: restaurant2 } = await supabase
    .from('restaurants')
    .insert({
      owner_id: user.id,
      name: 'Burger Bonanza',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  console.log('Demo data initialized');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);

        if (session?.user) {
          const currentUser = session.user as User;

          // Check if this is the demo account
          if (currentUser.email === "demo@foodbase.com") {
            setIsDemoAccount(true);
            currentUser.isDemo = true;
          } else {
            setIsDemoAccount(false);
          }

          setUser(currentUser);
        } else {
          setUser(null);
          setIsDemoAccount(false);
        }

        setLoading(false);
      }
    );

    // Initial session check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const currentUser = session.user as User;

        // Check if this is the demo account
        if (currentUser.email === "demo@foodbase.com") {
          setIsDemoAccount(true);
          currentUser.isDemo = true;
        }

        setUser(currentUser);
      }

      setLoading(false);
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Special handling for demo account
    if (email === "demo@foodbase.com") {
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user doesn't exist, create it
      if (error && error.status === 400) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: "Demo User",
            },
          },
        });

        if (signUpError) throw signUpError;

        // Initialize demo data
        if (data.user) {
          await initializeDemoData();
        }
      } else if (error) {
        throw error;
      } else {
        // User exists, initialize demo data if needed
        await initializeDemoData();
      }

      setIsDemoAccount(true);
      return;
    }

    // Regular login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
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
    const { data: { user: newUser } } = await supabase.auth.getUser();

    if (newUser) {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        role: 'customer', // Default role for new users
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsDemoAccount(false);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isDemoAccount,
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

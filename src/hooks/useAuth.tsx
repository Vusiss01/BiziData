import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeFoodBase } from "@/lib/firebase-alternative";

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
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

// Initialize FoodBase client
const foodbase = initializeFoodBase({
  apiKey: import.meta.env.VITE_FOODBASE_API_KEY || "demo-api-key",
  projectId: import.meta.env.VITE_FOODBASE_PROJECT_ID || "demo-project",
});

// Initialize demo data
const initializeDemoData = async () => {
  const auth = foodbase.getAuth();

  // Create demo restaurant data
  const restaurantsCollection = foodbase.collection("restaurants");
  if ((await restaurantsCollection.getAll()).length === 0) {
    await restaurantsCollection.add({
      name: "Pizza Palace",
      description: "Best pizza in town",
      address: {
        street: "123 Main St",
        city: "Foodville",
        state: "CA",
        zipCode: "12345",
        country: "USA",
      },
      contact: {
        phone: "555-123-4567",
        email: "info@pizzapalace.com",
        website: "https://pizzapalace.com",
      },
      cuisine: ["Italian", "Pizza"],
      priceRange: 2,
    });

    await restaurantsCollection.add({
      name: "Burger Bonanza",
      description: "Gourmet burgers and fries",
      address: {
        street: "456 Oak Ave",
        city: "Foodville",
        state: "CA",
        zipCode: "12345",
        country: "USA",
      },
      contact: {
        phone: "555-987-6543",
        email: "info@burgerbonanza.com",
        website: "https://burgerbonanza.com",
      },
      cuisine: ["American", "Burgers"],
      priceRange: 3,
    });
  }

  // Create demo schema data
  const schemasCollection = foodbase.collection("schemas");
  if ((await schemasCollection.getAll()).length === 0) {
    await schemasCollection.add({
      name: "Restaurant",
      description:
        "Core restaurant information including name, address, hours, and contact details",
      fields: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Unique identifier for the restaurant",
        },
        {
          name: "name",
          type: "string",
          required: true,
          description: "Name of the restaurant",
        },
        {
          name: "description",
          type: "string",
          required: false,
          description: "Description of the restaurant",
        },
        {
          name: "address",
          type: "object",
          required: true,
          description: "Physical address of the restaurant",
        },
        {
          name: "contact",
          type: "object",
          required: true,
          description: "Contact information for the restaurant",
        },
      ],
      relationships: [
        {
          from: "Restaurant",
          to: "Menu",
          type: "one-to-many",
          description: "A restaurant has many menu items",
        },
      ],
    });
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    const auth = foodbase.getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email === "demo@foodbase.com") {
        setIsDemoAccount(true);
      } else {
        setIsDemoAccount(false);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const auth = foodbase.getAuth();

    // Special handling for demo account
    if (email === "demo@foodbase.com") {
      // Initialize demo data
      await initializeDemoData();

      // Create or sign in demo user
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        // If demo user doesn't exist, create it
        const { user } = await auth.createUserWithEmailAndPassword(
          email,
          password,
        );
        if (user) {
          await user.updateProfile({ displayName: "Demo User" });
        }
      }
      setIsDemoAccount(true);
      return;
    }

    // Regular login
    await auth.signInWithEmailAndPassword(email, password);
  };

  const signup = async (email: string, password: string, name: string) => {
    const auth = foodbase.getAuth();
    const { user } = await auth.createUserWithEmailAndPassword(email, password);
    if (user) {
      await user.updateProfile({ displayName: name });
    }
  };

  const logout = async () => {
    const auth = foodbase.getAuth();
    await auth.signOut();
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

// Export the FoodBase client for direct use
export const getFoodBaseClient = () => foodbase;

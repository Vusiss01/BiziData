import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import * as authService from "@/services/authService";

// Extend FirebaseUser with our custom properties
interface User extends FirebaseUser {
  id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth - Setting up auth state listener");

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        console.log("Auth - User is logged in:", firebaseUser.uid);

        // Extend the Firebase user with our custom properties
        const customUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
        } as User;

        setUser(customUser);

        // Ensure the user exists in Firestore
        try {
          await authService.ensureUserExists(firebaseUser);
        } catch (error) {
          console.error("Auth - Error ensuring user exists:", error);
        }
      } else {
        console.log("Auth - No user is logged in");
        setUser(null);
      }

      setLoading(false);
    });

    // Clean up the listener on unmount
    return () => {
      console.log("Auth - Unsubscribing from auth state changes");
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, error } = await authService.login(email, password);
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { user, error } = await authService.signup(email, password, name);
      if (error) throw error;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await authService.logout();
      if (error) throw error;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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

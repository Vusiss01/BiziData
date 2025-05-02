import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole } from "./userService";

/**
 * Sign up a new user with email and password
 */
export const signup = async (
  email: string,
  password: string,
  name: string,
  role: UserRole = 'admin'
) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, { displayName: name });

    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email: email,
      name: name,
      role: role,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return { user, error: null };
  } catch (error) {
    console.error("Error signing up:", error);
    return { user: null, error };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Error logging in:", error);
    return { user: null, error };
  }
};

/**
 * Sign out the current user
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error("Error logging out:", error);
    return { success: false, error };
  }
};

/**
 * Get the current user's profile from Firestore
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return { profile: userDoc.data(), error: null };
    } else {
      return { profile: null, error: new Error("User profile not found") };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { profile: null, error };
  }
};

/**
 * Ensure the user exists in Firestore
 */
export const ensureUserExists = async (
  user: FirebaseUser,
  defaultRole: UserRole = 'admin'
) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        name: user.displayName || "User",
        role: defaultRole,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return { success: false, error };
  }
};

/**
 * Change the user's password
 * Requires re-authentication for security
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      return { success: false, error: new Error("No authenticated user found or user has no email") };
    }

    // Re-authenticate the user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Change the password
    await updatePassword(user, newPassword);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error };
  }
};

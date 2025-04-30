import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentData
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteFirebaseUser,
  getAuth
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";
import * as storageService from "@/services/storageService";

/**
 * User role type
 */
export type UserRole = 'admin' | 'owner' | 'store_manager' | 'cashier' | 'driver' | 'customer';

/**
 * User filter options
 */
export interface UserFilterOptions {
  role?: UserRole | UserRole[];
  search?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * User update options
 */
export interface UpdateUserOptions {
  name?: string;
  role?: UserRole;
  phone?: string | null;
  address?: string | null;
  current_suburb?: string | null;
  profile_image_url?: string | null;
  profile_image_path?: string | null;
}

/**
 * User creation options
 */
export interface CreateUserOptions {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  current_suburb?: string | null;
  profileImage?: File | null;
}

/**
 * Get all users with optional filtering
 */
export async function getUsers(options: UserFilterOptions = {}) {
  try {
    const { role, search, limit: limitCount = 100, page = 1, pageSize = 20, orderBy: orderByField = 'created_at', orderDirection = 'desc' } = options;

    // Build query constraints
    const constraints = [];

    // Filter by role
    if (role) {
      if (Array.isArray(role)) {
        constraints.push(where('role', 'in', role));
      } else {
        constraints.push(where('role', '==', role));
      }
    }

    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));

    // Add pagination
    if (page > 1) {
      // This is a simplified approach - for real pagination with Firestore,
      // you would need to store the last document from the previous page
      constraints.push(limit(pageSize));
    } else {
      constraints.push(limit(limitCount));
    }

    // Execute query
    const usersQuery = query(collection(db, 'users'), ...constraints);
    const snapshot = await getDocs(usersQuery);

    // Process results
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate()
    }));

    // Filter by search term if provided
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    return {
      data: filteredUsers,
      count: filteredUsers.length,
      error: null
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getUsers',
        options,
      },
    });

    return { data: [], count: 0, error };
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', id));

    if (!userDoc.exists()) {
      return { data: null, error: new Error(`User with ID ${id} not found`) };
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
      created_at: userDoc.data().created_at?.toDate(),
      updated_at: userDoc.data().updated_at?.toDate()
    };

    return { data: userData, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getUserById',
        userId: id,
      },
    });

    return { data: null, error };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return { authUser: null, dbUser: null, error: null };
    }

    // Get user data from Firestore
    const { data: dbUser, error } = await getUserById(currentUser.uid);

    if (error) {
      throw error;
    }

    return {
      authUser: currentUser,
      dbUser,
      error: null
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getCurrentUser',
      },
    });

    return { authUser: null, dbUser: null, error };
  }
}

/**
 * Ensure the current user exists in the database
 */
export async function ensureCurrentUser(defaultRole: UserRole = 'customer') {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

    if (!userDoc.exists()) {
      // Create user in Firestore
      const userData = {
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || 'User',
        role: defaultRole,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      await setDoc(doc(db, 'users', currentUser.uid), userData);

      return {
        ...userData,
        id: currentUser.uid
      };
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
      created_at: userDoc.data().created_at?.toDate(),
      updated_at: userDoc.data().updated_at?.toDate()
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'ensureCurrentUser',
        defaultRole,
      },
    });

    return null;
  }
}

/**
 * Update a user
 */
export async function updateUser(id: string, options: UpdateUserOptions) {
  try {
    const userRef = doc(db, 'users', id);

    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { data: null, error: new Error(`User with ID ${id} not found`) };
    }

    // Prepare update data
    const updateData = {
      ...options,
      updated_at: serverTimestamp()
    };

    // Update user in Firestore
    await updateDoc(userRef, updateData);

    // Get updated user data
    const updatedUserDoc = await getDoc(userRef);
    const userData = {
      id: updatedUserDoc.id,
      ...updatedUserDoc.data(),
      created_at: updatedUserDoc.data().created_at?.toDate(),
      updated_at: updatedUserDoc.data().updated_at?.toDate()
    };

    return { data: userData, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'updateUser',
        userId: id,
        options,
      },
    });

    return { data: null, error };
  }
}

/**
 * Upload a profile image for a user
 */
export async function uploadProfileImage(userId: string, file: File) {
  try {
    // Upload image to Firebase Storage
    const result = await storageService.uploadFile(file, {
      folderPath: `profile-images/${userId}`,
      fileName: `profile.${file.name.split('.').pop()}`,
      generateUniqueFilename: true
    });

    if (result.error) {
      throw result.error;
    }

    // Update user with profile image URL
    if (result.path && result.url) {
      await updateUser(userId, {
        profile_image_url: result.url,
        profile_image_path: result.path
      });
    }

    return result;
  } catch (error) {
    logError(error, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'uploadProfileImage',
        userId,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return { path: null, url: null, error };
  }
}

/**
 * Create a new user with authentication
 */
export async function createUser(options: CreateUserOptions) {
  try {
    const { email, password, name, role, phone, address, current_suburb, profileImage } = options;

    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Prepare user data for Firestore
    const userData = {
      id: user.uid,
      email,
      name,
      role,
      phone: phone || null,
      address: address || null,
      current_suburb: current_suburb || null,
      profile_image_url: null,
      profile_image_path: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    // Create user in Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    // Upload profile image if provided
    if (profileImage) {
      const imageResult = await uploadProfileImage(user.uid, profileImage);

      if (imageResult.url && imageResult.path) {
        userData.profile_image_url = imageResult.url;
        userData.profile_image_path = imageResult.path;
      }
    }

    return { user: { ...userData, id: user.uid }, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'createUser',
        email: options.email,
        role: options.role,
      },
    });

    return { user: null, error };
  }
}

/**
 * Create a user record in the database (without authentication)
 */
export async function createUserRecord(
  userData: {
    id?: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    address?: string;
    current_suburb?: string;
    profileImage?: File;
  }
) {
  try {
    const { id, email, name, role, phone, address, current_suburb, profileImage } = userData;

    // Generate ID if not provided
    const userId = id || doc(collection(db, 'users')).id;

    // Prepare user data
    const userDoc = {
      id: userId,
      email,
      name,
      role,
      phone: phone || null,
      address: address || null,
      current_suburb: current_suburb || null,
      profile_image_url: null,
      profile_image_path: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    // Create user in Firestore
    await setDoc(doc(db, 'users', userId), userDoc);

    // Upload profile image if provided
    if (profileImage) {
      const imageResult = await uploadProfileImage(userId, profileImage);

      if (imageResult.url && imageResult.path) {
        await updateDoc(doc(db, 'users', userId), {
          profile_image_url: imageResult.url,
          profile_image_path: imageResult.path
        });

        userDoc.profile_image_url = imageResult.url;
        userDoc.profile_image_path = imageResult.path;
      }
    }

    return { user: userDoc, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'createUserRecord',
        email: userData.email,
        role: userData.role,
      },
    });

    return { user: null, error };
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole | UserRole[], options: Omit<UserFilterOptions, 'role'> = {}) {
  return getUsers({ ...options, role });
}

/**
 * Get restaurant owners
 */
export async function getRestaurantOwners(options: Omit<UserFilterOptions, 'role'> = {}) {
  return getUsersByRole('owner', options);
}

/**
 * Get drivers
 */
export async function getDrivers(options: Omit<UserFilterOptions, 'role'> = {}) {
  return getUsersByRole('driver', options);
}

/**
 * Change user role
 */
export async function changeUserRole(userId: string, newRole: UserRole) {
  return updateUser(userId, { role: newRole });
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    // First, get the user to check if they exist
    const { data: user, error: getUserError } = await getUserById(userId);

    if (getUserError) {
      throw getUserError;
    }

    if (!user) {
      return { success: false, error: new Error(`User with ID ${userId} not found`) };
    }

    // Delete user from Firestore
    await deleteDoc(doc(db, 'users', userId));

    // Try to delete from Firebase Auth if possible
    // Note: This requires admin privileges and might not work in client-side code
    try {
      // This is a simplified approach - in a real app, you would use Firebase Admin SDK
      // or a Cloud Function to delete the auth user
      const currentAuth = getAuth();
      if (currentAuth.currentUser?.uid === userId) {
        await deleteFirebaseUser(currentAuth.currentUser);
      }
    } catch (authError) {
      // Log but don't fail if we can't delete the auth user
      // This might require server-side code
      logError(authError, {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.WARNING,
        context: {
          action: 'deleteUser',
          userId,
          message: 'Failed to delete auth user, but Firestore user was deleted',
        },
      });
    }

    // Delete profile image if it exists
    if (user.profile_image_path) {
      await storageService.deleteFile(user.profile_image_path);
    }

    return { success: true, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'deleteUser',
        userId,
      },
    });

    return { success: false, error };
  }
}
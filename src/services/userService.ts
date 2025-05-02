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
  is_verified?: boolean;
}

/**
 * Get all users with optional filtering
 */
export async function getUsers(options: UserFilterOptions = {}) {
  try {
    console.log(`Getting users with options:`, options);
    const { role, search, limit: limitCount = 100, page = 1, pageSize = 20, orderBy: orderByField = 'created_at', orderDirection = 'desc' } = options;

    // Build query constraints
    const constraints = [];

    // Filter by role
    if (role) {
      if (Array.isArray(role)) {
        console.log(`Filtering by roles: ${role.join(', ')}`);
        constraints.push(where('role', 'in', role));
      } else {
        console.log(`Filtering by role: ${role}`);
        constraints.push(where('role', '==', role));
      }
    }

    // Add ordering - only if the field exists in the documents
    try {
      constraints.push(orderBy(orderByField, orderDirection));
      console.log(`Ordering by ${orderByField} ${orderDirection}`);
    } catch (orderError) {
      console.error(`Error adding orderBy constraint:`, orderError);
      // If ordering fails, continue without it
    }

    // Add pagination
    if (page > 1) {
      console.log(`Using pagination: page ${page}, size ${pageSize}`);
      constraints.push(limit(pageSize));
    } else {
      console.log(`Using limit: ${limitCount}`);
      constraints.push(limit(limitCount));
    }

    console.log(`Executing Firestore query on 'users' collection with ${constraints.length} constraints`);

    // Execute query
    const usersQuery = query(collection(db, 'users'), ...constraints);
    const snapshot = await getDocs(usersQuery);

    console.log(`Query returned ${snapshot.docs.length} documents`);

    // Process results
    const users = snapshot.docs.map(doc => {
      const data = doc.data();

      // Log user data for debugging
      console.log(`Processing user ${doc.id}:`, {
        name: data.name,
        email: data.email,
        profile_image_url: data.profile_image_url,
        avatar_url: data.avatar_url // Some users might have avatar_url instead
      });

      // Check for profile image in different possible fields
      const profileImageUrl = data.profile_image_url || data.avatar_url || null;

      console.log(`Final profile image URL for ${doc.id}:`, profileImageUrl);

      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.() || data.created_at,
        updated_at: data.updated_at?.toDate?.() || data.updated_at,
        // Ensure profile_image_url is properly set, checking multiple possible fields
        profile_image_url: profileImageUrl
      };
    });

    // Filter by search term if provided
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      console.log(`Filtering by search term: "${search}"`);
      filteredUsers = users.filter(user =>
        (user.name || '').toLowerCase().includes(searchLower) ||
        (user.email || '').toLowerCase().includes(searchLower)
      );
      console.log(`Search filtered results: ${filteredUsers.length} users`);
    }

    // Return mock data if no users found (temporary solution)
    if (filteredUsers.length === 0 && !search) {
      console.log(`No users found, returning mock data`);
      const mockUsers = getMockUsers(role);
      return {
        data: mockUsers,
        count: mockUsers.length,
        error: null
      };
    }

    return {
      data: filteredUsers,
      count: filteredUsers.length,
      error: null
    };
  } catch (error) {
    console.error(`Error in getUsers:`, error);

    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getUsers',
        options,
      },
    });

    // Return mock data as fallback
    console.log(`Returning mock data as fallback due to error`);
    const mockUsers = getMockUsers(options.role);
    return {
      data: mockUsers,
      count: mockUsers.length,
      error
    };
  }
}

/**
 * Get mock users for testing and fallback
 */
function getMockUsers(role?: UserRole | UserRole[]): any[] {
  const timestamp = new Date().toISOString();

  const allMockUsers = [
    {
      id: "mock-admin-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin" as UserRole,
      phone: "+1234567890",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-admin-1%2Fprofile.jpg?alt=media"
    },
    {
      id: "mock-owner-1",
      name: "Restaurant Owner 1",
      email: "owner1@example.com",
      role: "owner" as UserRole,
      phone: "+1234567891",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-owner-1%2Fprofile.jpg?alt=media"
    },
    {
      id: "mock-owner-2",
      name: "Restaurant Owner 2",
      email: "owner2@example.com",
      role: "owner" as UserRole,
      phone: "+1234567894",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-owner-2%2Fprofile.jpg?alt=media"
    },
    {
      id: "mock-owner-3",
      name: "Restaurant Owner 3",
      email: "owner3@example.com",
      role: "owner" as UserRole,
      phone: "+1234567895",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-owner-3%2Fprofile.jpg?alt=media"
    },
    {
      id: "mock-driver-1",
      name: "Delivery Driver",
      email: "driver@example.com",
      role: "driver" as UserRole,
      phone: "+1234567892",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-driver-1%2Fprofile.jpg?alt=media"
    },
    {
      id: "mock-customer-1",
      name: "Customer User",
      email: "customer@example.com",
      role: "customer" as UserRole,
      phone: "+1234567893",
      created_at: timestamp,
      updated_at: timestamp,
      profile_image_url: "https://firebasestorage.googleapis.com/v0/b/bizibase.firebasestorage.app/o/profile-images%2Fmock-customer-1%2Fprofile.jpg?alt=media"
    }
  ];

  // Filter by role if specified
  if (role) {
    if (Array.isArray(role)) {
      return allMockUsers.filter(user => role.includes(user.role));
    } else {
      return allMockUsers.filter(user => user.role === role);
    }
  }

  return allMockUsers;
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
    console.log(`Starting profile image upload for user ${userId}`);
    console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`);

    // Upload image to Firebase Storage
    const result = await storageService.uploadFile(file, {
      folderPath: `profile-images/${userId}`,
      fileName: `profile.${file.name.split('.').pop()}`,
      generateUniqueFilename: true
    });

    if (result.error) {
      console.error(`Error uploading profile image:`, result.error);
      throw result.error;
    }

    console.log(`Image uploaded successfully to path: ${result.path}`);
    console.log(`Image URL: ${result.url}`);

    // Update user with profile image URL
    if (result.path && result.url) {
      console.log(`Updating user ${userId} with profile image information`);
      await updateUser(userId, {
        profile_image_url: result.url,
        profile_image_path: result.path
      });
      console.log(`User profile updated with image information`);
    }

    return result;
  } catch (error) {
    console.error(`Error in uploadProfileImage:`, error);

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
    const { email, password, name, role, phone, address, current_suburb, profileImage, is_verified = true } = options;

    console.log(`Creating user with email: ${email}, role: ${role}`);

    // Step 1: Create user in Firebase Authentication
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`User created in Firebase Auth with UID: ${userCredential.user.uid}`);
    } catch (authError: any) {
      console.error(`Error creating user in Firebase Auth:`, authError);

      // Handle specific Firebase Auth errors
      if (authError.code) {
        switch (authError.code) {
          case 'auth/email-already-in-use':
            throw new Error('This email address is already in use. Please use a different email.');
          case 'auth/invalid-email':
            throw new Error('The email address is not valid.');
          case 'auth/operation-not-allowed':
            throw new Error('Email/password accounts are not enabled. Please contact support.');
          case 'auth/weak-password':
            throw new Error('The password is too weak. Please use a stronger password.');
          default:
            throw new Error(`Authentication error: ${authError.message || 'Unknown error'}`);
        }
      }
      throw authError;
    }

    const user = userCredential.user;

    // Step 2: Update display name
    try {
      await updateProfile(user, { displayName: name });
      console.log(`Updated display name to: ${name}`);
    } catch (profileError) {
      console.error(`Error updating user profile:`, profileError);
      // Continue even if profile update fails
    }

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
      is_verified: is_verified,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    // Step 3: Create user in Firestore
    try {
      console.log(`Creating user document in Firestore with ID: ${user.uid}`);
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log(`User document created successfully in Firestore`);
    } catch (firestoreError) {
      console.error(`Error creating user document in Firestore:`, firestoreError);

      // If Firestore creation fails, we should still return the user
      // since they've been created in Firebase Auth
      logError(firestoreError, {
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.ERROR,
        context: {
          action: 'createUser_firestoreStep',
          userId: user.uid,
          email: email,
          role: role,
        },
      });

      // Return the user even though Firestore creation failed
      return {
        user: {
          id: user.uid,
          email,
          name,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: new Error('User created in authentication but failed to save to database. Some features may be limited.')
      };
    }

    // Step 4: Upload profile image if provided
    if (profileImage) {
      try {
        console.log(`Uploading profile image for user: ${user.uid}`);
        const imageResult = await uploadProfileImage(user.uid, profileImage);

        if (imageResult.url && imageResult.path) {
          userData.profile_image_url = imageResult.url;
          userData.profile_image_path = imageResult.path;
          console.log(`Profile image uploaded successfully: ${imageResult.url}`);
        } else {
          console.log(`Profile image upload did not return URL or path`);
        }
      } catch (imageError) {
        console.error(`Error uploading profile image:`, imageError);
        // Continue even if image upload fails
      }
    }

    console.log(`User creation completed successfully`);
    return { user: { ...userData, id: user.uid }, error: null };
  } catch (error: any) {
    console.error(`Error creating user:`, error);

    // Log the error
    logError(error, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'createUser',
        email: options.email,
        role: options.role,
        errorCode: error.code,
      },
    });

    // Create a mock user for testing purposes if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`Creating mock user for development testing`);
      const mockUserId = `mock-${Date.now()}`;
      const mockUser = {
        id: mockUserId,
        email: options.email,
        name: options.name,
        role: options.role,
        phone: options.phone || null,
        address: options.address || null,
        current_suburb: options.current_suburb || null,
        profile_image_url: null,
        profile_image_path: null,
        is_verified: options.is_verified !== undefined ? options.is_verified : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isMockUser: true
      };

      return {
        user: mockUser,
        error: new Error('Using mock user due to creation error. This is only for development testing.')
      };
    }

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
    is_verified?: boolean;
  }
) {
  try {
    const { id, email, name, role, phone, address, current_suburb, profileImage, is_verified = true } = userData;

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
      is_verified: is_verified,
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
  console.log(`Getting users by role: ${Array.isArray(role) ? role.join(', ') : role}`);
  try {
    const result = await getUsers({ ...options, role });
    console.log(`getUsersByRole result: ${result.data.length} users found`);
    return result;
  } catch (error) {
    console.error(`Error in getUsersByRole:`, error);
    // Return mock data filtered by role as fallback
    const mockUsers = getMockUsers(role);
    return {
      data: mockUsers,
      count: mockUsers.length,
      error
    };
  }
}

/**
 * Get restaurant owners - simplified direct approach
 */
export async function getRestaurantOwners(options: Omit<UserFilterOptions, 'role'> = {}) {
  console.log('Getting restaurant owners from database - SIMPLIFIED APPROACH');

  try {
    // First, try to get ALL users from the database
    console.log('Fetching ALL users from Firestore to find owners');

    // Get all users without any constraints
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);

    console.log(`Found ${snapshot.docs.length} total users in database`);

    // Log each user for debugging
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`User: id=${doc.id}, name=${data.name}, email=${data.email}, role=${data.role}`);
    });

    // Filter for owners manually after fetching all users
    const owners = snapshot.docs
      .filter(doc => {
        const role = doc.data().role;
        // Check for any variation of "owner" in the role field
        const isOwner = role &&
          (role === 'owner' ||
           role === 'Owner' ||
           role === 'restaurant owner' ||
           role === 'Restaurant Owner' ||
           role.toLowerCase().includes('owner'));

        if (isOwner) {
          console.log(`Found owner: ${doc.data().name} with role "${role}"`);
        }

        return isOwner;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || data.created_at,
          updated_at: data.updated_at?.toDate?.() || data.updated_at
        };
      });

    console.log(`After filtering, found ${owners.length} restaurant owners`);

    // If we found real owners in the database, return them
    if (owners.length > 0) {
      console.log(`Returning ${owners.length} real restaurant owners from database`);
      return {
        data: owners,
        count: owners.length,
        error: null
      };
    }

    // If no owners found, create a temporary owner based on the current user
    console.log('No restaurant owners found in database, creating a temporary owner');

    // Get current user
    const currentUser = auth.currentUser;
    let tempOwner;

    if (currentUser) {
      console.log(`Creating temporary owner based on current user: ${currentUser.displayName || currentUser.email}`);
      tempOwner = {
        id: currentUser.uid,
        name: currentUser.displayName || "Current User",
        email: currentUser.email || "unknown@example.com",
        role: "owner" as UserRole,
        phone: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to save this user as an owner in the database
      try {
        console.log(`Attempting to save current user as an owner in the database`);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Update existing user to have owner role
          await updateDoc(userRef, {
            role: "owner",
            updated_at: serverTimestamp()
          });
          console.log(`Updated existing user to have owner role`);
        } else {
          // Create new user with owner role
          await setDoc(userRef, {
            name: currentUser.displayName || "Current User",
            email: currentUser.email,
            role: "owner",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
          console.log(`Created new user with owner role`);
        }
      } catch (saveError) {
        console.error(`Error saving user as owner:`, saveError);
      }
    } else {
      console.log(`No current user, creating generic temporary owner`);
      tempOwner = {
        id: "temp-owner-" + Date.now(),
        name: "Temporary Owner",
        email: "temp@example.com",
        role: "owner" as UserRole,
        phone: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return {
      data: [tempOwner],
      count: 1,
      error: null
    };
  } catch (error) {
    console.error('Error in getRestaurantOwners:', error);

    // Create a fallback owner in case of error
    const fallbackOwner = {
      id: "fallback-owner-" + Date.now(),
      name: "Emergency Fallback Owner",
      email: "fallback@example.com",
      role: "owner" as UserRole,
      phone: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`Returning emergency fallback owner due to error`);
    return {
      data: [fallbackOwner],
      count: 1,
      error
    };
  }
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
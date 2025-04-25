import { supabase } from "@/lib/supabase";
import { syncUser, UserData } from "@/utils/userSync";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";
import { fetchData, fetchById, updateRecord } from "@/utils/dataUtils";
import { uploadFile, deleteFile, FileUploadResult } from "@/utils/fileUpload";

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
    const {
      role,
      search,
      limit,
      page,
      pageSize = 10,
      orderBy = 'created_at',
      orderDirection = 'desc',
    } = options;

    // Build filters
    const filters: Record<string, any> = {};

    if (role) {
      filters.role = role;
    }

    // Build fetch options
    const fetchOptions = {
      select: '*',
      filters,
      order: {
        column: orderBy,
        ascending: orderDirection === 'asc',
      },
      limit,
      page,
      pageSize,
    };

    // Handle search separately
    if (search) {
      // Use custom query for search
      let query = supabase
        .from('users')
        .select(fetchOptions.select, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply search
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

      // Apply sorting
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (page !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count, error: null };
    }

    // Use generic fetch for non-search queries
    return await fetchData<UserData>('users', fetchOptions);
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
    return await fetchById<UserData>('users', id);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'getUserById',
        id,
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
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      return { authUser: null, dbUser: null, error: null };
    }

    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (dbError) {
      throw dbError;
    }

    return {
      authUser: authData.user,
      dbUser: dbUser as UserData || null,
      error: null,
    };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.AUTHENTICATION,
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
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("No authenticated user found");
    }

    return await syncUser(authData.user.id, {
      email: authData.user.email || '',
      name: authData.user.user_metadata?.name || 'User',
      role: defaultRole,
    });
  } catch (error) {
    logError(error, {
      category: ErrorCategory.AUTHENTICATION,
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
    // Validate ID
    if (!id) {
      throw new Error("User ID is required");
    }

    // Prepare update data
    const updateData = {
      ...options,
      updated_at: new Date().toISOString(),
    };

    // Update user
    return await updateRecord<UserData>('users', id, updateData);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'updateUser',
        id,
        options,
      },
    });

    return { data: null, error };
  }
}

/**
 * Upload a profile image for a user
 */
export async function uploadProfileImage(userId: string, file: File): Promise<FileUploadResult> {
  try {
    // First check if user exists
    const { data: user } = await getUserById(userId);

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Delete existing profile image if it exists
    if (user.profile_image_path) {
      await deleteFile(user.profile_image_path);
    }

    // Upload new profile image
    const result = await uploadFile(file, {
      bucket: 'avatars',
      folderPath: `users/${userId}`,
      isPublic: true,
      generateUniqueFilename: true,
    });

    if (result.error) {
      throw result.error;
    }

    // Update user record with new profile image
    if (result.path && result.url) {
      await updateUser(userId, {
        profile_image_url: result.url,
        profile_image_path: result.path,
      });
    }

    return result;
  } catch (error) {
    logError(error, {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'uploadProfileImage',
        userId,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return { path: null, url: null, error: error as Error };
  }
}

/**
 * Create a new user with authentication
 */
export async function createUser(options: CreateUserOptions) {
  try {
    const { email, password, name, role, phone, address, current_suburb, profileImage } = options;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user in authentication system");
    }

    // Upload profile image if provided
    let profileImageUrl = null;
    let profileImagePath = null;

    if (profileImage) {
      const uploadResult = await uploadFile(profileImage, {
        bucket: 'avatars',
        folderPath: `users/${authData.user.id}`,
        isPublic: true,
        generateUniqueFilename: true,
      });

      if (uploadResult.error) {
        console.error("Error uploading profile image:", uploadResult.error);
      } else {
        profileImageUrl = uploadResult.url;
        profileImagePath = uploadResult.path;
      }
    }

    // Create user record in database
    const user = await syncUser(authData.user.id, {
      email: authData.user.email || email,
      name,
      role,
      phone,
      address,
      current_suburb,
      profile_image_url: profileImageUrl,
      profile_image_path: profileImagePath,
    });

    if (!user) {
      throw new Error("Failed to create user record in database");
    }

    return { user, error: null };
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
 * This is useful for creating users that don't need to log in
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
    const timestamp = new Date().toISOString();
    const { id, email, name, role, phone, address, current_suburb, profileImage } = userData;

    // Upload profile image if provided
    let profileImageUrl = null;
    let profileImagePath = null;

    if (profileImage && id) {
      const uploadResult = await uploadFile(profileImage, {
        bucket: 'avatars',
        folderPath: `users/${id}`,
        isPublic: true,
        generateUniqueFilename: true,
      });

      if (uploadResult.error) {
        console.error("Error uploading profile image:", uploadResult.error);
      } else {
        profileImageUrl = uploadResult.url;
        profileImagePath = uploadResult.path;
      }
    }

    // Create user record
    const { data: user, error } = await supabase.from('users').insert({
      id, // Optional, will be generated if not provided
      email,
      name,
      role,
      phone: phone || null,
      address: address || null,
      current_suburb: current_suburb || null,
      profile_image_url: profileImageUrl,
      profile_image_path: profileImagePath,
      created_at: timestamp,
      updated_at: timestamp,
    }).select().single();

    if (error) {
      throw error;
    }

    // If profile image was provided but no ID was provided initially,
    // we need to upload the image now that we have the generated ID
    if (profileImage && !id && user) {
      const uploadResult = await uploadFile(profileImage, {
        bucket: 'avatars',
        folderPath: `users/${user.id}`,
        isPublic: true,
        generateUniqueFilename: true,
      });

      if (uploadResult.error) {
        console.error("Error uploading profile image:", uploadResult.error);
      } else {
        // Update user with profile image URL
        await updateUser(user.id, {
          profile_image_url: uploadResult.url,
          profile_image_path: uploadResult.path,
        });

        // Update the user object to return
        user.profile_image_url = uploadResult.url;
        user.profile_image_path = uploadResult.path;
      }
    }

    return { user, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'createUserRecord',
        userData: {
          ...userData,
          profileImage: userData.profileImage ? `${userData.profileImage.name} (${userData.profileImage.size} bytes)` : null,
        },
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
    // First get the user to check if they have a profile image
    const { data: user } = await getUserById(userId);

    if (user?.profile_image_path) {
      // Delete profile image
      await deleteFile(user.profile_image_path);
    }

    // Delete user from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      throw dbError;
    }

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting user from auth:", authError);
      // Continue anyway, as the database record is deleted
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
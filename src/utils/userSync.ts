import { supabase } from "@/lib/supabase";

/**
 * User data interface representing the structure of a user in the database
 */
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'owner' | 'store_manager' | 'cashier' | 'driver' | 'customer';
  phone?: string | null;
  address?: string | null;
  current_suburb?: string | null;
  profile_image_url?: string | null;
  profile_image_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Synchronizes a user between Supabase Auth and the users table
 *
 * This function ensures that a user exists in the database users table
 * with the same ID as in Supabase Auth. It handles all error cases and
 * provides detailed logging.
 *
 * @param userId - The user ID to synchronize (optional, uses current user if not provided)
 * @param userData - Optional user data to use for creation/update
 * @returns The synchronized user data or null if synchronization failed
 */
export const syncUser = async (
  userId?: string,
  userData?: Partial<UserData>
): Promise<UserData | null> => {
  try {
    console.log("Starting user synchronization...");

    // If no userId provided, get the current authenticated user
    if (!userId) {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error getting authenticated user:", authError);
        return null;
      }

      if (!authData.user) {
        console.error("No authenticated user found");
        return null;
      }

      userId = authData.user.id;
    }

    console.log(`Synchronizing user with ID: ${userId}`);

    // Check if user already exists in the database
    const { data: existingUser, error: queryError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking if user exists:", queryError);
      return null;
    }

    // If user exists, return or update
    if (existingUser) {
      console.log("User already exists in database");

      // If userData provided, update the user
      if (userData && Object.keys(userData).length > 0) {
        console.log("Updating existing user with new data");

        const updateData = {
          ...userData,
          updated_at: new Date().toISOString()
        };

        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError);
          return existingUser as UserData;
        }

        return updatedUser as UserData;
      }

      return existingUser as UserData;
    }

    // User doesn't exist, need to create
    console.log("User doesn't exist in database, creating new user record");

    // Get auth user details if not provided
    let email = userData?.email;
    let name = userData?.name;
    let role = userData?.role || 'customer';

    if (!email || !name) {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error getting auth user details:", authError);
        return null;
      }

      if (!authData.user) {
        console.error("No authenticated user found");
        return null;
      }

      email = email || authData.user.email;
      name = name || authData.user.user_metadata?.name || 'User';
    }

    if (!email) {
      console.error("Cannot create user without email");
      return null;
    }

    // Try using the RPC function first (which has security_definer privilege)
    try {
      console.log("Attempting to create user via RPC function");
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_profile', {
        user_id: userId,
        user_email: email,
        user_name: name,
        user_role: role,
        user_phone: userData?.phone || null,
        user_address: userData?.address || null,
        user_suburb: userData?.current_suburb || null
      });

      if (rpcError) {
        console.error("Error using RPC to create user:", rpcError);
        // Fall back to direct insert
      } else {
        console.log("Successfully created user record via RPC");

        // Fetch the created user
        const { data: newUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("Error fetching newly created user:", fetchError);
          return null;
        }

        return newUser as UserData;
      }
    } catch (rpcError) {
      console.error("Exception using RPC to create user:", rpcError);
      // Fall back to direct insert
    }

    // Direct insert as fallback
    console.log("Falling back to direct insert");
    const newUserData = {
      id: userId,
      email: email,
      name: name,
      role: role,
      phone: userData?.phone || null,
      address: userData?.address || null,
      current_suburb: userData?.current_suburb || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert(newUserData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user record:", insertError);

      // Special handling for foreign key violations
      if (insertError.code === '23503') {
        console.error("Foreign key violation - this may indicate an issue with the database schema");
      }

      // Special handling for unique constraint violations
      if (insertError.code === '23505') {
        console.error("Unique constraint violation - a user with this email may already exist");
      }

      return null;
    }

    console.log("Successfully created user record via direct insert");
    return insertedUser as UserData;
  } catch (error) {
    console.error("Unexpected error in syncUser:", error);
    return null;
  }
};

/**
 * Ensures the current authenticated user exists in the users table
 *
 * @param defaultRole - The default role to assign if creating a new user
 * @returns The user data or null if synchronization failed
 */
export const ensureCurrentUser = async (
  defaultRole: 'admin' | 'owner' | 'store_manager' | 'cashier' | 'driver' | 'customer' = 'customer'
): Promise<UserData | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Error getting authenticated user:", authError);
      return null;
    }

    if (!authData.user) {
      console.error("No authenticated user found");
      return null;
    }

    return syncUser(authData.user.id, {
      email: authData.user.email || '',
      name: authData.user.user_metadata?.name || 'User',
      role: defaultRole
    });
  } catch (error) {
    console.error("Error in ensureCurrentUser:", error);
    return null;
  }
};

/**
 * Gets the current user from both Auth and the database
 *
 * @returns An object containing both the auth user and database user
 */
export const getCurrentUser = async () => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Error getting authenticated user:", authError);
      return { authUser: null, dbUser: null };
    }

    if (!authData.user) {
      return { authUser: null, dbUser: null };
    }

    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (dbError) {
      console.error("Error getting user from database:", dbError);
    }

    return {
      authUser: authData.user,
      dbUser: dbUser as UserData || null
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return { authUser: null, dbUser: null };
  }
};

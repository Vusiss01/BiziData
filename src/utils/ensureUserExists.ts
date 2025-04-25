import { supabase } from "@/lib/supabase";

/**
 * Ensures that the authenticated user exists in the users table
 * This is needed because the restaurants table has a foreign key constraint on owner_id
 */
export const ensureUserExists = async (userId: string, email: string, name: string = "User") => {
  if (!userId) {
    console.error("Cannot ensure user exists: No user ID provided");
    return false;
  }

  try {
    console.log("Checking if user exists in database:", userId);

    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
      return false;
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log("User does not exist in database, creating user record...");

      // Try using the RPC function first (which has security_definer privilege)
      try {
        const { data, error } = await supabase.rpc('update_user_profile', {
          user_id: userId,
          user_email: email,
          user_name: name,
          user_role: 'owner', // Set as owner for restaurant creation
          user_phone: null,
          user_address: null,
          user_suburb: null
        });

        if (error) {
          console.error("Error using RPC to create user:", error);
          // Fall back to direct insert
        } else {
          console.log("Successfully created user record via RPC");
          return true;
        }
      } catch (rpcError) {
        console.error("Exception using RPC to create user:", rpcError);
        // Fall back to direct insert
      }

      // Direct insert as fallback
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email: email,
        name: name,
        role: "owner", // Set as owner for restaurant creation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (insertError) {
        console.error("Error creating user record:", insertError);
        return false;
      }

      console.log("Successfully created user record via direct insert");
      return true;
    }

    console.log("User already exists in database");
    return true; // User already exists
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    return false;
  }
};

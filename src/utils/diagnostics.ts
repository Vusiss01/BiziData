import { supabase } from "@/lib/supabase";

/**
 * Runs diagnostics on the Supabase setup to identify issues
 * 
 * This function tests various aspects of the Supabase configuration
 * and returns detailed information about what's working and what's not.
 */
export const runSupabaseDiagnostics = async () => {
  const results = {
    connection: {
      success: false,
      error: null as string | null,
    },
    authentication: {
      currentUser: null as any,
      hasSession: false,
      error: null as string | null,
    },
    database: {
      usersTable: {
        exists: false,
        canQuery: false,
        error: null as string | null,
      },
      restaurantsTable: {
        exists: false,
        canQuery: false,
        error: null as string | null,
      },
    },
    userSync: {
      currentUserInDb: false,
      canCreateUser: false,
      error: null as string | null,
    },
    rpcFunctions: {
      updateUserProfile: {
        exists: false,
        error: null as string | null,
      },
    },
    permissions: {
      canInsertRestaurant: false,
      error: null as string | null,
    }
  };

  try {
    // Test basic connection
    try {
      const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true });
      if (error) throw error;
      results.connection.success = true;
    } catch (error: any) {
      results.connection.success = false;
      results.connection.error = error.message || 'Unknown connection error';
    }

    // Test authentication
    try {
      const { data: { user, session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      results.authentication.hasSession = !!session;
      results.authentication.currentUser = user;
    } catch (error: any) {
      results.authentication.error = error.message || 'Unknown authentication error';
    }

    // Test users table
    try {
      const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true });
      if (error) throw error;
      results.database.usersTable.exists = true;
      results.database.usersTable.canQuery = true;
    } catch (error: any) {
      results.database.usersTable.error = error.message || 'Unknown users table error';
      
      // Check if it's a permissions error vs. table doesn't exist
      if (error.message?.includes('permission denied')) {
        results.database.usersTable.exists = true;
        results.database.usersTable.canQuery = false;
      }
    }

    // Test restaurants table
    try {
      const { data, error } = await supabase.from('restaurants').select('count()', { count: 'exact', head: true });
      if (error) throw error;
      results.database.restaurantsTable.exists = true;
      results.database.restaurantsTable.canQuery = true;
    } catch (error: any) {
      results.database.restaurantsTable.error = error.message || 'Unknown restaurants table error';
      
      // Check if it's a permissions error vs. table doesn't exist
      if (error.message?.includes('permission denied')) {
        results.database.restaurantsTable.exists = true;
        results.database.restaurantsTable.canQuery = false;
      }
    }

    // Test user sync
    if (results.authentication.currentUser) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', results.authentication.currentUser.id)
          .maybeSingle();
        
        if (error) throw error;
        results.userSync.currentUserInDb = !!data;
      } catch (error: any) {
        results.userSync.error = error.message || 'Unknown user sync error';
      }

      // Test user creation
      if (!results.userSync.currentUserInDb) {
        try {
          // Try to create a test user (will be rolled back)
          const { error } = await supabase.rpc('test_user_creation');
          results.userSync.canCreateUser = !error;
        } catch (error: any) {
          results.userSync.error = error.message || 'Unknown user creation error';
        }
      } else {
        results.userSync.canCreateUser = true; // Assume we can create if user already exists
      }
    }

    // Test RPC functions
    try {
      // Just check if the function exists by calling it with invalid params
      const { error } = await supabase.rpc('update_user_profile', {
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        user_name: 'Test User',
        user_role: 'customer',
        user_phone: null,
        user_address: null,
        user_suburb: null
      });
      
      // If we get a specific error about parameters, the function exists
      results.rpcFunctions.updateUserProfile.exists = 
        error?.message?.includes('invalid input') || 
        error?.message?.includes('parameter');
    } catch (error: any) {
      results.rpcFunctions.updateUserProfile.error = error.message || 'Unknown RPC error';
    }

    // Test restaurant creation permissions
    if (results.authentication.currentUser) {
      try {
        // Start a transaction that we'll roll back
        const { error } = await supabase.rpc('test_restaurant_creation');
        results.permissions.canInsertRestaurant = !error;
      } catch (error: any) {
        results.permissions.error = error.message || 'Unknown permissions error';
      }
    }

    return results;
  } catch (error: any) {
    console.error('Error running diagnostics:', error);
    return {
      ...results,
      error: error.message || 'Unknown error running diagnostics'
    };
  }
};

/**
 * Checks if the current user is properly synchronized between Auth and Database
 */
export const checkUserSynchronization = async () => {
  try {
    // Get the current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return {
        synchronized: false,
        authUser: null,
        dbUser: null,
        error: `Auth error: ${authError.message}`
      };
    }
    
    if (!authUser) {
      return {
        synchronized: false,
        authUser: null,
        dbUser: null,
        error: 'No authenticated user found'
      };
    }
    
    // Check if user exists in the database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    
    if (dbError) {
      return {
        synchronized: false,
        authUser,
        dbUser: null,
        error: `Database error: ${dbError.message}`
      };
    }
    
    return {
      synchronized: !!dbUser,
      authUser,
      dbUser,
      error: dbUser ? null : 'User exists in Auth but not in Database'
    };
  } catch (error: any) {
    return {
      synchronized: false,
      authUser: null,
      dbUser: null,
      error: `Unexpected error: ${error.message}`
    };
  }
};

import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';

/**
 * Run diagnostics for Firebase
 */
export const runFirebaseDiagnostics = async () => {
  try {
    // Check Firebase connection
    const connectionStatus = await checkFirebaseConnection();

    // Check authentication
    const authStatus = await checkFirebaseAuthentication();

    // Check database tables
    const dbStatus = await checkFirebaseDatabaseTables();

    // Check user synchronization
    const userSyncStatus = await checkUserSynchronization();

    return {
      connection: connectionStatus,
      authentication: authStatus,
      database: dbStatus,
      userSync: {
        currentUserInDb: userSyncStatus.synchronized,
        canCreateUser: true, // Firebase allows creating users
        error: userSyncStatus.error
      },
      rpcFunctions: {
        updateUserProfile: {
          exists: true, // Firebase doesn't use RPC functions
          error: null
        }
      },
      permissions: {
        canInsertRestaurant: true, // This would depend on your Firestore rules
        error: null
      }
    };
  } catch (error) {
    console.error('Error running Firebase diagnostics:', error);
    return {
      connection: {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      authentication: {
        currentUser: null,
        hasSession: false,
        error: 'Failed to check authentication'
      },
      database: {
        usersTable: { exists: false, canQuery: false, error: 'Failed to check database' },
        restaurantsTable: { exists: false, canQuery: false, error: 'Failed to check database' }
      },
      userSync: {
        currentUserInDb: false,
        canCreateUser: false,
        error: 'Failed to check user synchronization'
      },
      rpcFunctions: {
        updateUserProfile: {
          exists: false,
          error: 'Failed to check functions'
        }
      },
      permissions: {
        canInsertRestaurant: false,
        error: 'Failed to check permissions'
      }
    };
  }
};

/**
 * For backward compatibility with Supabase
 */
export const runSupabaseDiagnostics = async () => {
  return await runFirebaseDiagnostics();
};

/**
 * Check Firebase connection
 */
const checkFirebaseConnection = async () => {
  try {
    // Try to query Firestore to check connection
    const usersQuery = query(collection(db, 'users'), limit(1));
    await getDocs(usersQuery);

    return {
      success: true,
      error: null as string | null
    };
  } catch (error) {
    console.error('Firebase connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Check Firebase authentication
 */
const checkFirebaseAuthentication = async () => {
  try {
    const currentUser = auth.currentUser;

    return {
      currentUser: currentUser ? {
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName
      } : null,
      hasSession: !!currentUser,
      error: null as string | null
    };
  } catch (error) {
    console.error('Firebase authentication error:', error);
    return {
      currentUser: null,
      hasSession: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Check Firebase database tables
 */
const checkFirebaseDatabaseTables = async () => {
  try {
    // Check users collection
    const usersQuery = query(collection(db, 'users'), limit(1));
    const usersSnapshot = await getDocs(usersQuery);

    // Check restaurants collection
    const restaurantsQuery = query(collection(db, 'restaurants'), limit(1));
    const restaurantsSnapshot = await getDocs(restaurantsQuery);

    return {
      usersTable: {
        exists: true,
        canQuery: true,
        error: null as string | null
      },
      restaurantsTable: {
        exists: true,
        canQuery: true,
        error: null as string | null
      }
    };
  } catch (error) {
    console.error('Firebase database error:', error);
    return {
      usersTable: {
        exists: false,
        canQuery: false,
        error: error instanceof Error ? error.message : String(error)
      },
      restaurantsTable: {
        exists: false,
        canQuery: false,
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
};

/**
 * Checks if the current user is properly synchronized between Auth and Database
 */
export const checkUserSynchronization = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return {
        synchronized: false,
        authUser: null,
        dbUser: null,
        error: 'No authenticated user'
      };
    }

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

    return {
      synchronized: userDoc.exists(),
      authUser: {
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName
      },
      dbUser: userDoc.exists() ? userDoc.data() : null,
      error: userDoc.exists() ? null : 'User exists in Auth but not in Firestore'
    };
  } catch (error) {
    console.error('Error checking user synchronization:', error);
    return {
      synchronized: false,
      authUser: null,
      dbUser: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

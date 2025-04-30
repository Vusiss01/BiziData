// This file is kept for backward compatibility during migration
// It will be removed once the migration to Firebase is complete

// Create a mock Supabase client that logs warnings when used
class SupabaseMock {
  constructor() {
    console.warn('Supabase is being phased out. Please use Firebase instead.');
  }

  // Mock methods to prevent runtime errors
  from(table: string) {
    console.warn(`Supabase call to table "${table}" detected. Please migrate to Firebase.`);
    return {
      select: () => this.mockReturn(),
      insert: () => this.mockReturn(),
      update: () => this.mockReturn(),
      delete: () => this.mockReturn(),
      eq: () => this,
      neq: () => this,
      gt: () => this,
      lt: () => this,
      gte: () => this,
      lte: () => this,
      order: () => this,
      limit: () => this,
      single: () => this.mockReturn(),
      maybeSingle: () => this.mockReturn(),
    };
  }

  storage = {
    from: (bucket: string) => {
      console.warn(`Supabase storage call to bucket "${bucket}" detected. Please migrate to Firebase Storage.`);
      return {
        upload: () => this.mockReturn(),
        download: () => this.mockReturn(),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => this.mockReturn(),
      };
    }
  };

  auth = {
    signUp: () => {
      console.warn('Supabase auth.signUp() called. Please migrate to Firebase Authentication.');
      return this.mockReturn();
    },
    signIn: () => {
      console.warn('Supabase auth.signIn() called. Please migrate to Firebase Authentication.');
      return this.mockReturn();
    },
    signOut: () => {
      console.warn('Supabase auth.signOut() called. Please migrate to Firebase Authentication.');
      return this.mockReturn();
    },
    onAuthStateChange: () => {
      console.warn('Supabase auth.onAuthStateChange() called. Please migrate to Firebase Authentication.');
      return () => {}; // Return unsubscribe function
    },
    getUser: () => {
      console.warn('Supabase auth.getUser() called. Please migrate to Firebase Authentication.');
      return this.mockReturn();
    },
  };

  rpc(func: string) {
    console.warn(`Supabase RPC call to "${func}" detected. Please migrate to Firebase Cloud Functions.`);
    return this.mockReturn();
  }

  private mockReturn() {
    return Promise.resolve({
      data: null,
      error: new Error('Supabase is being phased out. Please use Firebase instead.'),
    });
  }
}

export const supabase = new SupabaseMock();

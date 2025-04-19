// This is a simplified Firebase/Supabase alternative implementation
// In a real implementation, this would connect to a backend service

type DataListener = (data: any) => void;

class FoodBaseClient {
  private apiKey: string;
  private projectId: string;
  private collections: Record<string, Collection>;
  private listeners: Record<string, DataListener[]>;
  private storage: Storage;
  private auth: Auth;

  constructor(config: { apiKey: string; projectId: string }) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.collections = {};
    this.listeners = {};
    this.storage = new Storage(this);
    this.auth = new Auth(this);
  }

  // Database methods
  collection(name: string): Collection {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(this, name);
    }
    return this.collections[name];
  }

  // Subscribe to real-time updates
  subscribe(path: string, callback: DataListener) {
    if (!this.listeners[path]) {
      this.listeners[path] = [];
    }
    this.listeners[path].push(callback);
    return () => this.unsubscribe(path, callback);
  }

  unsubscribe(path: string, callback: DataListener) {
    if (this.listeners[path]) {
      this.listeners[path] = this.listeners[path].filter(
        (cb) => cb !== callback,
      );
    }
  }

  // Notify listeners of changes
  notifyListeners(path: string, data: any) {
    if (this.listeners[path]) {
      this.listeners[path].forEach((callback) => callback(data));
    }
  }

  // Get storage instance
  getStorage() {
    return this.storage;
  }

  // Get auth instance
  getAuth() {
    return this.auth;
  }
}

class Collection {
  private client: FoodBaseClient;
  private name: string;
  private documents: Record<string, any>;

  constructor(client: FoodBaseClient, name: string) {
    this.client = client;
    this.name = name;
    this.documents = {};
  }

  // Add a document with auto-generated ID
  async add(data: any): Promise<{ id: string; data: any }> {
    const id = this.generateId();
    return this.doc(id).set(data);
  }

  // Get a document reference
  doc(id: string): Document {
    return new Document(this.client, `${this.name}/${id}`, id, this);
  }

  // Query the collection
  where(field: string, operator: string, value: any): Query {
    return new Query(this.client, this.name, [{ field, operator, value }]);
  }

  // Get all documents
  async getAll(): Promise<Array<{ id: string; data: any }>> {
    // In a real implementation, this would fetch from a backend
    const results: Array<{ id: string; data: any }> = [];
    for (const id in this.documents) {
      results.push({ id, data: this.documents[id] });
    }
    return results;
  }

  // Generate a unique ID
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // For internal use
  _setDocument(id: string, data: any) {
    this.documents[id] = { ...data, updatedAt: new Date() };
    if (!this.documents[id].createdAt) {
      this.documents[id].createdAt = new Date();
    }
  }

  _getDocument(id: string) {
    return this.documents[id];
  }
}

class Document {
  private client: FoodBaseClient;
  private path: string;
  private id: string;
  private collection: Collection;

  constructor(
    client: FoodBaseClient,
    path: string,
    id: string,
    collection: Collection,
  ) {
    this.client = client;
    this.path = path;
    this.id = id;
    this.collection = collection;
  }

  // Set document data
  async set(data: any): Promise<{ id: string; data: any }> {
    // In a real implementation, this would send to a backend
    this.collection._setDocument(this.id, data);
    this.client.notifyListeners(this.path, data);
    return { id: this.id, data };
  }

  // Update document data
  async update(data: any): Promise<{ id: string; data: any }> {
    const currentData = this.collection._getDocument(this.id) || {};
    const newData = { ...currentData, ...data };
    this.collection._setDocument(this.id, newData);
    this.client.notifyListeners(this.path, newData);
    return { id: this.id, data: newData };
  }

  // Get document data
  async get(): Promise<{ id: string; data: any } | null> {
    const data = this.collection._getDocument(this.id);
    if (!data) return null;
    return { id: this.id, data };
  }

  // Delete document
  async delete(): Promise<void> {
    // In a real implementation, this would send to a backend
    this.collection._setDocument(this.id, null);
    this.client.notifyListeners(this.path, null);
  }

  // Subscribe to real-time updates
  onSnapshot(callback: (data: any) => void) {
    return this.client.subscribe(this.path, callback);
  }
}

class Query {
  private client: FoodBaseClient;
  private collectionName: string;
  private filters: Array<{ field: string; operator: string; value: any }>;
  private limitValue: number | null = null;

  constructor(
    client: FoodBaseClient,
    collectionName: string,
    filters: Array<{ field: string; operator: string; value: any }>,
  ) {
    this.client = client;
    this.collectionName = collectionName;
    this.filters = filters;
  }

  // Add another where clause
  where(field: string, operator: string, value: any): Query {
    this.filters.push({ field, operator, value });
    return this;
  }

  // Limit the number of results
  limit(value: number): Query {
    this.limitValue = value;
    return this;
  }

  // Execute the query
  async get(): Promise<Array<{ id: string; data: any }>> {
    // In a real implementation, this would query a backend
    const collection = this.client.collection(this.collectionName);
    const allDocs = await collection.getAll();

    // Apply filters
    let results = allDocs.filter((doc) => {
      return this.filters.every((filter) => {
        const { field, operator, value } = filter;
        const fieldValue = this.getNestedValue(doc.data, field);

        switch (operator) {
          case "==":
            return fieldValue === value;
          case "!=":
            return fieldValue !== value;
          case ">":
            return fieldValue > value;
          case ">=":
            return fieldValue >= value;
          case "<":
            return fieldValue < value;
          case "<=":
            return fieldValue <= value;
          case "array-contains":
            return Array.isArray(fieldValue) && fieldValue.includes(value);
          default:
            return false;
        }
      });
    });

    // Apply limit
    if (this.limitValue !== null) {
      results = results.slice(0, this.limitValue);
    }

    return results;
  }

  // Subscribe to real-time updates
  onSnapshot(callback: (data: Array<{ id: string; data: any }>) => void) {
    // In a real implementation, this would set up a real-time listener
    this.get().then(callback);
    return () => {}; // Unsubscribe function
  }

  // Helper to get nested values
  private getNestedValue(obj: any, path: string) {
    const keys = path.split(".");
    return keys.reduce(
      (o, key) => (o && o[key] !== undefined ? o[key] : undefined),
      obj,
    );
  }
}

class Storage {
  private client: FoodBaseClient;
  private files: Record<string, { data: any; metadata: any; url: string }>;

  constructor(client: FoodBaseClient) {
    this.client = client;
    this.files = {};
  }

  // Get a reference to a file
  ref(path: string): StorageRef {
    return new StorageRef(this, path);
  }

  // For internal use
  _uploadFile(path: string, data: any, metadata: any): string {
    this.files[path] = {
      data,
      metadata,
      url: `https://storage.foodbase.app/${path}`,
    };
    return this.files[path].url;
  }

  _getFile(path: string) {
    return this.files[path];
  }
}

class StorageRef {
  private storage: Storage;
  private path: string;

  constructor(storage: Storage, path: string) {
    this.storage = storage;
    this.path = path;
  }

  // Upload a file
  async upload(data: any, metadata: any = {}): Promise<{ url: string }> {
    // In a real implementation, this would upload to a storage service
    const url = this.storage._uploadFile(this.path, data, metadata);
    return { url };
  }

  // Get download URL
  async getDownloadURL(): Promise<string> {
    const file = this.storage._getFile(this.path);
    if (!file) throw new Error("File not found");
    return file.url;
  }

  // Delete a file
  async delete(): Promise<void> {
    // In a real implementation, this would delete from a storage service
  }
}

class Auth {
  private client: FoodBaseClient;
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];

  constructor(client: FoodBaseClient) {
    this.client = client;
  }

  // Sign up with email and password
  async createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{ user: User }> {
    // In a real implementation, this would call an authentication service
    const user = new User({
      uid: Math.random().toString(36).substring(2, 15),
      email,
      emailVerified: false,
      displayName: null,
      photoURL: null,
    });
    this.currentUser = user;
    this.notifyAuthStateListeners();
    return { user };
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{ user: User }> {
    // In a real implementation, this would call an authentication service
    const user = new User({
      uid: Math.random().toString(36).substring(2, 15),
      email,
      emailVerified: false,
      displayName: null,
      photoURL: null,
    });
    this.currentUser = user;
    this.notifyAuthStateListeners();
    return { user };
  }

  // Sign out
  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyAuthStateListeners();
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Listen for auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    this.authStateListeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyAuthStateListeners() {
    this.authStateListeners.forEach((callback) => callback(this.currentUser));
  }
}

class User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;

  constructor(data: {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    photoURL: string | null;
  }) {
    this.uid = data.uid;
    this.email = data.email;
    this.emailVerified = data.emailVerified;
    this.displayName = data.displayName;
    this.photoURL = data.photoURL;
  }

  // Update profile
  async updateProfile(data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    if (data.displayName) this.displayName = data.displayName;
    if (data.photoURL) this.photoURL = data.photoURL;
  }
}

// Initialize FoodBase
export const initializeFoodBase = (config: {
  apiKey: string;
  projectId: string;
}) => {
  return new FoodBaseClient(config);
};

// Export types
export type { FoodBaseClient };

# Supabase to Firebase Migration Guide

This guide provides instructions for migrating your BiziData project from Supabase to Firebase.

## Overview

The migration involves:

1. Setting up a Firebase project
2. Migrating authentication
3. Migrating database (Supabase to Firestore)
4. Migrating storage
5. Updating your code to use Firebase APIs

## Step 1: Set Up Firebase

Follow the instructions in the [Firebase Setup Guide](./FIREBASE_SETUP.md) to create and configure your Firebase project.

## Step 2: Migrate Authentication

### Export Users from Supabase

1. In the Supabase dashboard, go to "Authentication" > "Users"
2. Export your users (you may need to use the Supabase API for this)

### Import Users to Firebase

You can use the Firebase Admin SDK to import users:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// For each user from Supabase
const importUsers = async (supabaseUsers) => {
  for (const user of supabaseUsers) {
    try {
      await admin.auth().createUser({
        uid: user.id, // Use the same ID to maintain references
        email: user.email,
        displayName: user.name,
        // Add other properties as needed
      });
      
      // Create user document in Firestore
      await admin.firestore().collection('users').doc(user.id).set({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // Add other properties as needed
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Imported user: ${user.email}`);
    } catch (error) {
      console.error(`Error importing user ${user.email}:`, error);
    }
  }
};
```

## Step 3: Migrate Database

### Export Data from Supabase

1. In the Supabase dashboard, go to "Database" > "Tables"
2. For each table, export the data as JSON

### Import Data to Firestore

You can use the Firebase Admin SDK to import data:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// For each table from Supabase
const importCollection = async (collectionName, jsonFilePath) => {
  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  
  const batch = admin.firestore().batch();
  let count = 0;
  
  for (const item of data) {
    // Convert Supabase IDs to strings if they're not already
    const id = String(item.id);
    
    // Create a document reference
    const docRef = admin.firestore().collection(collectionName).doc(id);
    
    // Remove the id field from the data (it will be the document ID)
    const { id: _, ...docData } = item;
    
    // Add timestamps
    docData.created_at = item.created_at 
      ? admin.firestore.Timestamp.fromDate(new Date(item.created_at))
      : admin.firestore.FieldValue.serverTimestamp();
    
    docData.updated_at = item.updated_at
      ? admin.firestore.Timestamp.fromDate(new Date(item.updated_at))
      : admin.firestore.FieldValue.serverTimestamp();
    
    // Add the document to the batch
    batch.set(docRef, docData);
    
    count++;
    
    // Firestore batches are limited to 500 operations
    if (count >= 500) {
      await batch.commit();
      console.log(`Committed batch of ${count} documents to ${collectionName}`);
      batch = admin.firestore().batch();
      count = 0;
    }
  }
  
  // Commit any remaining documents
  if (count > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${count} documents to ${collectionName}`);
  }
  
  console.log(`Imported ${data.length} documents to ${collectionName}`);
};
```

## Step 4: Migrate Storage

### Export Files from Supabase Storage

1. In the Supabase dashboard, go to "Storage"
2. Download all files from your buckets

### Upload Files to Firebase Storage

You can use the Firebase Admin SDK to upload files:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// For each file from Supabase Storage
const uploadFile = async (localFilePath, storagePath) => {
  try {
    const bucket = admin.storage().bucket();
    
    await bucket.upload(localFilePath, {
      destination: storagePath,
      metadata: {
        contentType: getContentType(localFilePath),
      },
    });
    
    console.log(`Uploaded ${localFilePath} to ${storagePath}`);
  } catch (error) {
    console.error(`Error uploading ${localFilePath}:`, error);
  }
};

// Helper function to determine content type
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    // Add more as needed
  };
  
  return contentTypes[ext] || 'application/octet-stream';
};
```

## Step 5: Update Your Code

### Authentication

Replace Supabase authentication with Firebase Authentication:

```typescript
// Old Supabase code
const { user, error } = await supabase.auth.signUp({
  email,
  password,
});

// New Firebase code
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
```

### Database

Replace Supabase database queries with Firestore queries:

```typescript
// Old Supabase code
const { data, error } = await supabase
  .from("restaurants")
  .select("*")
  .eq("status", "active");

// New Firebase code
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const q = query(
  collection(db, "restaurants"),
  where("status", "==", "active")
);

const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Storage

Replace Supabase storage with Firebase Storage:

```typescript
// Old Supabase code
const { data, error } = await supabase.storage
  .from("avatars")
  .upload("public/avatar.png", file);

// New Firebase code
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const storageRef = ref(storage, "avatars/avatar.png");
const snapshot = await uploadBytes(storageRef, file);
const url = await getDownloadURL(snapshot.ref);
```

## Testing the Migration

After completing the migration:

1. Test user authentication (sign up, sign in, sign out)
2. Test database operations (create, read, update, delete)
3. Test storage operations (upload, download, delete)
4. Test any custom functionality specific to your application

## Rollback Plan

If you encounter issues during the migration:

1. Keep both Supabase and Firebase configurations in your code
2. Use feature flags to control which backend is used
3. If necessary, revert to Supabase by toggling the feature flag

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

# Firebase Setup Guide

This guide will help you set up Firebase for your BiziData project.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "BiziData")
4. Follow the setup wizard (you can enable Google Analytics if you want)
5. Click "Create project"

## Step 2: Register Your Web App

1. In the Firebase Console, select your project
2. Click the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "BiziData Web")
4. Check "Also set up Firebase Hosting" if you plan to deploy your app
5. Click "Register app"
6. Copy the Firebase configuration object (you'll need this later)

## Step 3: Enable Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Email/Password" provider
4. (Optional) Enable other authentication providers as needed
5. Go to the "Users" tab to manage users

## Step 4: Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (test mode is easier for development)
4. Select a location for your database
5. Click "Enable"

## Step 5: Set Up Storage

1. In the Firebase Console, go to "Storage" in the left sidebar
2. Click "Get started"
3. Review and accept the default security rules (or customize them)
4. Click "Next"
5. Select a location for your storage bucket
6. Click "Done"

## Step 6: Configure Your App

1. Open `src/lib/firebase.ts` in your project
2. Replace the placeholder configuration with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 7: Set Up Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click the "Rules" tab
3. Update the rules to secure your data. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all restaurants
    match /restaurants/{restaurantId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Add more rules as needed
  }
}
```

## Step 8: Set Up Storage Security Rules

1. In the Firebase Console, go to "Storage" in the left sidebar
2. Click the "Rules" tab
3. Update the rules to secure your storage. Here's a basic example:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read and write their own profile images
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all restaurant images
    match /restaurant-images/{restaurantId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Add more rules as needed
  }
}
```

## Step 9: Install Firebase CLI (Optional)

If you want to use Firebase Hosting, Functions, or other advanced features:

1. Install the Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in your project:
   ```
   firebase init
   ```

## Step 10: Deploy Your App (Optional)

If you've set up Firebase Hosting:

1. Build your app:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Troubleshooting

- **Authentication Issues**: Make sure you've enabled the authentication providers you're using.
- **Firestore Access Denied**: Check your security rules and make sure users have the necessary permissions.
- **Storage Access Denied**: Check your storage rules and make sure users have the necessary permissions.
- **CORS Issues**: If you're having CORS issues with Storage, make sure you've configured CORS in the Firebase Console.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

# BiziData - Firebase Integration

BiziData is a React application built with TypeScript and Vite, integrated with Firebase for authentication, database, and storage.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Vusiss01/BiziData.git
   cd BiziData
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Open `src/lib/firebase.ts`
   - Replace the placeholder values with your actual Firebase project configuration
   - You can find your Firebase configuration in the Firebase Console under Project Settings

4. Start the development server:
   ```
   npm run dev
   ```

## Firebase Configuration

This project uses Firebase for:
- Authentication (Email/Password)
- Firestore Database
- Storage

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Set up Storage
5. Get your Firebase configuration from Project Settings
6. Update `src/lib/firebase.ts` with your configuration

### Security Rules

The project includes security rules for Firestore and Storage:
- `firestore.rules` - Rules for Firestore database
- `storage.rules` - Rules for Firebase Storage

To deploy these rules:
```
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Project Structure

- `src/lib/firebase.ts` - Firebase configuration and initialization
- `src/services/` - Firebase service modules
  - `authService.ts` - Authentication services
  - `databaseService.ts` - Firestore database operations
  - `storageService.ts` - Firebase Storage operations
  - `userService.ts` - User management services
- `src/hooks/` - React hooks for Firebase
  - `useAuth.tsx` - Authentication hook
  - `useDatabase.tsx` - Database hook
  - `useStorage.tsx` - Storage hook
  - `useUserProfile.tsx` - User profile hook

## Additional Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Firebase Integration Summary](./FIREBASE_INTEGRATION_SUMMARY.md)

## Development

This project uses:
- React 18
- TypeScript
- Vite
- Firebase
- React Router
- Tailwind CSS
- shadcn/ui components

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, setDoc, doc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgGOBNWqAgJk7P5goOuM-Q8LbQO-qnJvk",
  authDomain: "bizibase.firebaseapp.com",
  projectId: "bizibase",
  storageBucket: "bizibase.firebasestorage.app",
  messagingSenderId: "846283526881",
  appId: "1:846283526881:web:e5e5075f46050985a55da0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to check for existing owners
async function checkOwners() {
  console.log('Checking for existing owners...');
  
  try {
    const ownersQuery = query(collection(db, 'users'), where('role', '==', 'owner'));
    const snapshot = await getDocs(ownersQuery);
    
    console.log(`Found ${snapshot.docs.length} owners:`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}), ID: ${doc.id}`);
    });
    
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error checking owners:', error);
    return 0;
  }
}

// Function to create a test owner
async function createTestOwner() {
  console.log('Creating test owner...');
  
  try {
    const ownerId = 'test-owner-' + Date.now();
    const ownerData = {
      id: ownerId,
      name: 'Test Restaurant Owner',
      email: 'testowner@example.com',
      role: 'owner',
      phone: '+1234567890',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', ownerId), ownerData);
    console.log(`Test owner created with ID: ${ownerId}`);
    return true;
  } catch (error) {
    console.error('Error creating test owner:', error);
    return false;
  }
}

// Main function
async function main() {
  const ownerCount = await checkOwners();
  
  if (ownerCount === 0) {
    console.log('No owners found. Creating a test owner...');
    await createTestOwner();
    await checkOwners(); // Check again to confirm
  } else {
    console.log(`Found ${ownerCount} existing owners. No need to create a test owner.`);
  }
  
  process.exit(0);
}

main();

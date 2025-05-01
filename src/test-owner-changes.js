// Test script to verify our changes to the Restaurant Owners page

import { createUser } from './services/userService';
import { getRestaurantOwners } from './services/userService';

// Test function to create a restaurant owner with a profile image and verified status
async function testCreateVerifiedOwner() {
  console.log('Creating a verified restaurant owner with profile image...');
  
  // Create a test profile image
  const testImageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
  const testImageFile = new File([testImageBlob], 'test-profile.jpg', { type: 'image/jpeg' });
  
  // Create a verified owner
  const result = await createUser({
    email: 'verified-owner@example.com',
    password: 'password123',
    name: 'Verified Owner',
    role: 'owner',
    profileImage: testImageFile,
    is_verified: true
  });
  
  console.log('Verified owner creation result:', result);
  return result;
}

// Test function to create a restaurant owner with pending status
async function testCreatePendingOwner() {
  console.log('Creating a pending restaurant owner...');
  
  // Create a pending owner
  const result = await createUser({
    email: 'pending-owner@example.com',
    password: 'password123',
    name: 'Pending Owner',
    role: 'owner',
    is_verified: false
  });
  
  console.log('Pending owner creation result:', result);
  return result;
}

// Test function to get all restaurant owners
async function testGetRestaurantOwners() {
  console.log('Getting all restaurant owners...');
  
  const result = await getRestaurantOwners();
  
  console.log('Restaurant owners result:', result);
  console.log('Owner data details:');
  
  if (result.data && result.data.length > 0) {
    result.data.forEach((owner, index) => {
      console.log(`Owner ${index + 1}:`);
      console.log(`- ID: ${owner.id}`);
      console.log(`- Name: ${owner.name}`);
      console.log(`- Email: ${owner.email}`);
      console.log(`- Profile Image URL: ${owner.profile_image_url || 'None'}`);
      console.log(`- Is Verified: ${owner.is_verified}`);
      console.log(`- Status: ${owner.status || 'Not set'}`);
    });
  }
  
  return result;
}

// Export the test functions
export {
  testCreateVerifiedOwner,
  testCreatePendingOwner,
  testGetRestaurantOwners
};

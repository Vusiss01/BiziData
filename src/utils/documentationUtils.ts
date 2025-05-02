import { Documentation } from '@/services/documentationService';

// Define the documentation categories
export const DOCUMENTATION_CATEGORIES = [
  'Getting Started',
  'Restaurant Management',
  'Order Processing',
  'Driver Management',
  'User Management',
  'Menu Management',
  'Inventory Management',
  'Analytics'
];

// Map file names to documentation objects
export const DOCUMENTATION_FILES: Record<string, Omit<Documentation, 'id' | 'created_at' | 'updated_at'>> = {
  'getting-started': {
    title: 'Getting Started with FoodBase',
    description: 'Learn how to set up and start using the FoodBase platform',
    content: '', // Will be loaded dynamically
    category: 'Getting Started',
    tags: ['setup', 'introduction', 'basics']
  },
  'restaurant-management': {
    title: 'Restaurant Management Guide',
    description: 'Comprehensive guide for managing restaurants in the system',
    content: '', // Will be loaded dynamically
    category: 'Restaurant Management',
    tags: ['restaurant', 'management', 'setup']
  },
  'order-processing': {
    title: 'Order Processing Workflow',
    description: 'Step-by-step guide for handling orders from receipt to delivery',
    content: '', // Will be loaded dynamically
    category: 'Order Processing',
    tags: ['orders', 'workflow', 'process']
  },
  'driver-management': {
    title: 'Driver Management',
    description: 'Guide for adding and managing delivery drivers',
    content: '', // Will be loaded dynamically
    category: 'Driver Management',
    tags: ['drivers', 'delivery', 'management']
  },
  'user-management': {
    title: 'User Roles and Permissions',
    description: 'Detailed explanation of different user roles and their permissions',
    content: '', // Will be loaded dynamically
    category: 'User Management',
    tags: ['users', 'roles', 'permissions', 'security']
  },
  'analytics': {
    title: 'Analytics Dashboard Guide',
    description: 'How to use and interpret the analytics dashboard',
    content: '', // Will be loaded dynamically
    category: 'Analytics',
    tags: ['analytics', 'reporting', 'metrics', 'data']
  },
  'menu-management': {
    title: 'Menu Management',
    description: 'Guide for creating and managing restaurant menus',
    content: '', // Will be loaded dynamically
    category: 'Menu Management',
    tags: ['menu', 'items', 'categories', 'pricing']
  },
  'inventory-management': {
    title: 'Inventory Management',
    description: 'How to track ingredients and manage stock levels',
    content: '', // Will be loaded dynamically
    category: 'Inventory Management',
    tags: ['inventory', 'stock', 'suppliers', 'orders']
  }
};

// Function to load documentation content from local files
export const loadLocalDocumentation = async (): Promise<Documentation[]> => {
  const docs: Documentation[] = [];

  try {
    // For each documentation file
    for (const [key, doc] of Object.entries(DOCUMENTATION_FILES)) {
      try {
        // Try to load from public directory first
        let response = await fetch(`/src/docs/${key}.md`);

        // If that fails, try the src directory directly
        if (!response.ok) {
          console.log(`Trying alternate path for ${key}.md`);
          response = await fetch(`/docs/${key}.md`);
        }

        if (response.ok) {
          const content = await response.text();

          // Create a documentation object with the content
          docs.push({
            id: key,
            ...doc,
            content,
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`Successfully loaded documentation: ${key}`);
        } else {
          console.error(`Failed to load documentation file: ${key}.md`);
        }
      } catch (error) {
        console.error(`Error loading documentation file ${key}.md:`, error);
      }
    }

    return docs;
  } catch (error) {
    console.error('Error loading local documentation:', error);
    return [];
  }
};

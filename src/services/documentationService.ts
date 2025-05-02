import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertTimestamps } from './databaseService';
import { ErrorCategory, handleError } from '@/utils/errorHandler';

// Define the Documentation interface
export interface Documentation {
  id?: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  created_at?: Date | Timestamp;
  updated_at?: Date | Timestamp;
  url?: string;
}

/**
 * Add a new documentation item
 */
export const addDocumentation = async (documentation: Omit<Documentation, 'id' | 'created_at' | 'updated_at'>): Promise<Documentation | null> => {
  try {
    const docData = {
      ...documentation,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'documentation'), docData);
    
    return {
      id: docRef.id,
      ...docData
    };
  } catch (error) {
    handleError(error, {
      message: 'Failed to add documentation',
      category: ErrorCategory.DATABASE
    });
    return null;
  }
};

/**
 * Update an existing documentation item
 */
export const updateDocumentation = async (id: string, documentation: Partial<Omit<Documentation, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'documentation', id);
    
    await updateDoc(docRef, {
      ...documentation,
      updated_at: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    handleError(error, {
      message: `Failed to update documentation with ID ${id}`,
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Delete a documentation item
 */
export const deleteDocumentation = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'documentation', id));
    return true;
  } catch (error) {
    handleError(error, {
      message: `Failed to delete documentation with ID ${id}`,
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

/**
 * Get all documentation items
 */
export const getAllDocumentation = async (): Promise<Documentation[]> => {
  try {
    const q = query(collection(db, 'documentation'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Documentation));
  } catch (error) {
    handleError(error, {
      message: 'Failed to get all documentation',
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Get documentation by category
 */
export const getDocumentationByCategory = async (category: string): Promise<Documentation[]> => {
  try {
    const q = query(
      collection(db, 'documentation'),
      where('category', '==', category),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Documentation));
  } catch (error) {
    handleError(error, {
      message: `Failed to get documentation for category ${category}`,
      category: ErrorCategory.DATABASE
    });
    return [];
  }
};

/**
 * Initialize default documentation if none exists
 */
export const initializeDefaultDocumentation = async (): Promise<boolean> => {
  try {
    // Check if we already have documentation
    const docsQuery = query(collection(db, 'documentation'), limit(1));
    const snapshot = await getDocs(docsQuery);
    
    if (!snapshot.empty) {
      console.log('Documentation already exists, skipping initialization');
      return true;
    }
    
    console.log('Initializing default documentation');
    
    // Default documentation
    const defaultDocumentation = [
      {
        title: "Getting Started with FoodBase",
        description: "Learn how to set up and start using the FoodBase platform",
        content: `
# Getting Started with FoodBase

Welcome to FoodBase, your all-in-one solution for restaurant management and food delivery!

## Quick Start Guide

1. **Create your account**: Sign up with your email and password
2. **Set up your profile**: Add your personal information and preferences
3. **Explore the dashboard**: Familiarize yourself with the main features
4. **Add your first restaurant**: If you're a restaurant owner, add your restaurant details
5. **Start managing orders**: Begin tracking and managing food orders

## Key Features

- Restaurant management
- Order tracking
- Menu customization
- Driver management
- Real-time analytics

For more detailed information, check out our specific feature guides.
        `,
        category: "Getting Started",
        tags: ["setup", "introduction", "basics"]
      },
      {
        title: "Restaurant Management Guide",
        description: "Comprehensive guide for managing restaurants in the system",
        content: `
# Restaurant Management Guide

This guide covers everything you need to know about managing restaurants in FoodBase.

## Adding a New Restaurant

1. Navigate to the Restaurants page
2. Click "Add Restaurant"
3. Fill in all required details:
   - Restaurant name
   - Address
   - Contact information
   - Cuisine type
   - Operating hours
4. Upload restaurant images (logo and background)
5. Click "Save" to create your restaurant

## Managing Restaurant Details

- **Edit Information**: Update any restaurant details as needed
- **Menu Management**: Add, edit, or remove menu items
- **Staff Management**: Manage restaurant staff accounts
- **Order Settings**: Configure order acceptance and processing

## Restaurant Analytics

The Analytics dashboard provides valuable insights about your restaurant:
- Order volume
- Popular items
- Peak hours
- Customer satisfaction metrics

Use these insights to optimize your operations and increase profitability.
        `,
        category: "Restaurants",
        tags: ["restaurant", "management", "setup"]
      },
      {
        title: "Order Processing Workflow",
        description: "Step-by-step guide for handling orders from receipt to delivery",
        content: `
# Order Processing Workflow

This document outlines the complete order lifecycle in the FoodBase system.

## Order States

Orders in FoodBase go through the following states:
1. **Pending**: Order received but not yet accepted by the restaurant
2. **Accepted**: Restaurant has confirmed the order
3. **Preparing**: Food is being prepared
4. **Ready for Pickup**: Order is ready for the driver
5. **In Transit**: Driver has picked up the order and is en route
6. **Delivered**: Order has been delivered to the customer
7. **Cancelled**: Order was cancelled (can happen at various stages)

## Restaurant Actions

- **Accepting Orders**: Review incoming orders and accept or reject them
- **Updating Status**: Change order status as it progresses
- **Estimated Time**: Set and update preparation time
- **Special Instructions**: View and respond to customer notes

## Driver Actions

- **Order Assignment**: Accept delivery assignments
- **Pickup Confirmation**: Confirm when an order has been picked up
- **Navigation**: Use the built-in map for delivery directions
- **Delivery Confirmation**: Mark orders as delivered
- **Issue Reporting**: Report any problems during delivery

## Customer Experience

Customers can track their order status in real-time through the customer app, receiving notifications at each stage of the process.
        `,
        category: "Orders",
        tags: ["orders", "workflow", "process"]
      },
      {
        title: "Driver Management",
        description: "Guide for adding and managing delivery drivers",
        content: `
# Driver Management

This guide explains how to manage delivery drivers in the FoodBase system.

## Adding New Drivers

1. Navigate to the Drivers page
2. Click "Add Driver"
3. Fill in the driver's information:
   - Name and contact details
   - Vehicle information
   - Service area
   - Availability schedule
4. Upload required documents (license, insurance, etc.)
5. Set payment details
6. Click "Save" to create the driver profile

## Driver Assignment

There are two ways to assign orders to drivers:
1. **Automatic Assignment**: The system automatically assigns orders based on proximity and availability
2. **Manual Assignment**: Administrators can manually assign specific orders to drivers

## Monitoring Performance

Track driver performance through:
- Delivery times
- Customer ratings
- Order completion rate
- Active hours
- Earnings

## Driver App Features

Drivers use the FoodBase Driver App, which includes:
- Real-time order notifications
- Navigation assistance
- Customer contact options
- Delivery confirmation
- Earnings tracking

For technical support with the driver app, contact our support team.
        `,
        category: "Drivers",
        tags: ["drivers", "delivery", "management"]
      },
      {
        title: "Analytics Dashboard Guide",
        description: "How to use and interpret the analytics dashboard",
        content: `
# Analytics Dashboard Guide

The Analytics Dashboard provides powerful insights into your business performance.

## Overview

The dashboard is divided into several sections:
- Sales Summary
- Order Metrics
- Customer Insights
- Restaurant Performance
- Driver Efficiency

## Key Metrics Explained

### Sales Metrics
- **Gross Sales**: Total revenue before any deductions
- **Net Sales**: Revenue after discounts and refunds
- **Average Order Value**: Mean value of all orders
- **Sales by Time**: Revenue broken down by hour, day, or month

### Order Metrics
- **Order Volume**: Total number of orders
- **Completion Rate**: Percentage of successfully delivered orders
- **Cancellation Rate**: Percentage of cancelled orders
- **Average Preparation Time**: Mean time to prepare orders

### Customer Metrics
- **New vs. Returning**: Breakdown of new versus returning customers
- **Customer Retention**: Rate at which customers place repeat orders
- **Satisfaction Score**: Average rating from customer feedback

## Using Filters

Refine your data view using:
- Date range selectors
- Restaurant filters
- Order type filters
- Customer segment filters

## Exporting Data

To export data for further analysis:
1. Navigate to the desired report
2. Click the "Export" button
3. Choose your preferred format (CSV, Excel, PDF)
4. Save the file to your computer

## Setting Up Alerts

Configure automatic alerts for:
- Sales thresholds
- Order volume changes
- Rating drops
- Unusual activity

Contact the support team for help setting up custom alerts.
        `,
        category: "Analytics",
        tags: ["analytics", "reporting", "metrics", "data"]
      },
      {
        title: "User Roles and Permissions",
        description: "Detailed explanation of different user roles and their permissions",
        content: `
# User Roles and Permissions

FoodBase uses a role-based access control system to manage permissions.

## Available Roles

### Administrator
Administrators have full access to all system features and can:
- Manage all users, restaurants, and drivers
- Access all data and reports
- Configure system settings
- Create and manage other administrators

### Restaurant Owner
Restaurant owners can:
- Manage their own restaurant(s)
- View and process orders
- Manage their menu
- Access analytics for their restaurant(s)
- Manage their restaurant staff

### Restaurant Staff
Staff members can:
- View and process orders
- Update menu availability
- Manage day-to-day operations
- Access limited analytics

### Driver
Drivers can:
- View and accept delivery assignments
- Update order status
- Navigate to pickup and delivery locations
- Track their performance and earnings

### Customer
Customers can:
- Place and track orders
- View restaurant menus
- Manage their profile
- View order history

## Changing User Roles

Only administrators can change user roles:
1. Navigate to User Management
2. Select the user
3. Click "Edit Role"
4. Select the new role
5. Save changes

## Custom Permissions

For special cases, administrators can create custom permission sets:
1. Go to System Settings
2. Select "Custom Permissions"
3. Create a new permission set
4. Assign specific permissions
5. Assign the custom permission set to users

For security reasons, role changes are logged in the system audit trail.
        `,
        category: "Administration",
        tags: ["users", "roles", "permissions", "security"]
      },
      {
        title: "Troubleshooting Common Issues",
        description: "Solutions for frequently encountered problems",
        content: `
# Troubleshooting Common Issues

This guide provides solutions for common issues you might encounter while using FoodBase.

## Login Problems

### Can't Log In
- Verify your email address is correct
- Reset your password using the "Forgot Password" link
- Check if your account has been deactivated
- Clear browser cache and cookies

### Two-Factor Authentication Issues
- Ensure your device time is correctly synchronized
- Use backup codes if you can't access your authentication app
- Contact support if you've lost access to your authentication method

## Order Management Issues

### Orders Not Appearing
- Check your internet connection
- Verify filters are not excluding orders
- Refresh the page
- Confirm the order was successfully placed

### Can't Update Order Status
- Ensure you have the necessary permissions
- Check if the order is in a state that allows the update
- Refresh the page and try again
- Contact support if the problem persists

## Restaurant Management Issues

### Menu Items Not Displaying
- Verify the items are marked as active
- Check category assignments
- Ensure images are properly uploaded
- Clear browser cache

### Operating Hours Not Saving
- Use the correct time format (24-hour)
- Ensure end times are after start times
- Save changes before navigating away
- Try using a different browser

## Driver App Issues

### Location Tracking Problems
- Ensure location services are enabled on the device
- Check internet connectivity
- Restart the app
- Update to the latest version

### Delivery Confirmation Failures
- Verify internet connection
- Ensure you're within geofence of the delivery address
- Try restarting the app
- Contact support if issues persist

## Payment Processing Issues

### Failed Transactions
- Verify payment method details
- Check for sufficient funds
- Ensure the payment method is not expired
- Contact your bank if the issue persists

### Missing Earnings
- Allow 24 hours for processing
- Verify your banking information is correct
- Check the earnings report for discrepancies
- Contact support with specific transaction details

## Technical Issues

### App Crashes
- Update to the latest version
- Clear cache and data
- Restart your device
- Reinstall the application

### Slow Performance
- Check your internet connection
- Close unused applications
- Clear browser cache
- Try a different browser or device

For issues not covered here, please contact our support team through the Support page.
        `,
        category: "Support",
        tags: ["troubleshooting", "help", "issues", "support"]
      },
      {
        title: "API Documentation",
        description: "Technical documentation for the FoodBase API",
        content: `
# FoodBase API Documentation

This document provides technical details for developers integrating with the FoodBase API.

## Authentication

All API requests require authentication using OAuth 2.0:

\`\`\`
POST /oauth/token
Content-Type: application/json

{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
\`\`\`

The response will include an access token:

\`\`\`
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

Include this token in all API requests:

\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## Endpoints

### Restaurants

\`\`\`
GET /api/v1/restaurants
\`\`\`

Query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Results per page (default: 20)
- \`search\`: Search term
- \`cuisine\`: Filter by cuisine type

### Orders

\`\`\`
POST /api/v1/orders
\`\`\`

Request body:
\`\`\`
{
  "restaurant_id": "123",
  "customer_id": "456",
  "items": [
    {
      "item_id": "789",
      "quantity": 2,
      "special_instructions": "No onions"
    }
  ],
  "delivery_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345"
  },
  "payment_method_id": "pm_123456"
}
\`\`\`

### Webhooks

Set up webhooks to receive real-time updates:

\`\`\`
POST /api/v1/webhooks
\`\`\`

Request body:
\`\`\`
{
  "url": "https://your-server.com/webhook",
  "events": ["order.created", "order.updated", "order.completed"]
}
\`\`\`

## Rate Limits

- 100 requests per minute per API key
- 5,000 requests per day per API key

Exceeding these limits will result in a 429 Too Many Requests response.

## Error Handling

All errors follow this format:

\`\`\`
{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": [
      "Field 'quantity' must be greater than 0"
    ]
  }
}
\`\`\`

Common error codes:
- \`authentication_failed\`: Invalid credentials
- \`invalid_request\`: Malformed request
- \`not_found\`: Resource not found
- \`rate_limit_exceeded\`: Too many requests
- \`server_error\`: Internal server error

For detailed API documentation, visit our [Developer Portal](https://developers.foodbase.com).
        `,
        category: "Development",
        tags: ["api", "integration", "development", "technical"],
        url: "https://developers.foodbase.com"
      }
    ];
    
    // Add each documentation item
    for (const doc of defaultDocumentation) {
      await addDocumentation(doc);
    }
    
    console.log('Default documentation initialized successfully');
    return true;
  } catch (error) {
    handleError(error, {
      message: 'Failed to initialize default documentation',
      category: ErrorCategory.DATABASE
    });
    return false;
  }
};

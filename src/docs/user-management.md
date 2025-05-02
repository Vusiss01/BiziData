# User Management

This guide explains how to manage users and their roles within the FoodBase platform.

## User Roles Overview

FoodBase implements a role-based access control system with the following roles:

1. **Administrator**:
   - Full system access
   - Can manage all users, restaurants, and settings
   - Can view all data and reports
   - Can assign roles to other users

2. **Restaurant Owner**:
   - Can manage their own restaurant(s)
   - Can view and process orders for their restaurant(s)
   - Can manage their restaurant staff
   - Can access analytics for their restaurant(s)

3. **Restaurant Staff**:
   - Can process orders
   - Can update menu availability
   - Limited access to restaurant settings
   - Cannot access financial reports

4. **Driver**:
   - Can view and accept delivery assignments
   - Can update delivery status
   - Can access their earnings and performance metrics
   - Cannot access restaurant management features

## Adding New Users

To add a new user to the system:

1. Navigate to the **User Management** page
2. Click the **Add User** button
3. Fill in the user details:
   - Name
   - Email address
   - Phone number
   - Role selection
   - Initial password (or send invitation)
4. If adding a restaurant owner, you can assign restaurants
5. If adding a driver, you can set their service area
6. Click **Save** to create the user

## Managing Existing Users

To view and manage existing users:

1. Go to the **User Management** page
2. Use filters to find specific users:
   - Role
   - Status (active/inactive)
   - Restaurant association
   - Registration date
3. Click on a user to view their details
4. From the user detail page, you can:
   - Edit personal information
   - Change role
   - Reset password
   - Deactivate account
   - View activity history

## Changing User Roles

To change a user's role:

1. Navigate to the **User Management** page
2. Find and select the user
3. Click the **Edit** button
4. Change the role in the dropdown menu
5. If changing to Restaurant Owner, assign restaurants
6. If changing to Driver, set service area
7. Click **Save** to apply changes

## User Permissions

Each role has specific permissions:

### Administrator Permissions
- User management (create, edit, delete)
- Restaurant management (create, edit, delete)
- System configuration
- Financial reports access
- Analytics access
- Support ticket management

### Restaurant Owner Permissions
- Edit own restaurant details
- Manage restaurant menu
- Process orders
- View restaurant analytics
- Manage restaurant staff
- Access limited financial reports

### Restaurant Staff Permissions
- View and update orders
- Update menu item availability
- Basic restaurant analytics
- No access to financial data
- No user management capabilities

### Driver Permissions
- View available deliveries
- Accept/reject delivery assignments
- Update delivery status
- View personal performance metrics
- Access earnings information

## User Authentication

FoodBase uses secure authentication methods:

1. **Email/Password**: Standard login method
2. **Two-Factor Authentication**: Optional additional security
3. **Password Requirements**:
   - Minimum 8 characters
   - Must include uppercase, lowercase, number, and special character
   - Expires after 90 days

## User Profile Management

Users can manage their own profiles:

1. Click on the profile icon in the top-right corner
2. Select **Profile Settings**
3. Update personal information:
   - Name
   - Contact details
   - Profile picture
   - Password
   - Notification preferences
4. Enable/disable two-factor authentication
5. View account activity history

## User Activity Monitoring

For security and auditing purposes:

1. All user actions are logged
2. Administrators can view activity logs
3. Suspicious activity triggers alerts
4. Failed login attempts are tracked

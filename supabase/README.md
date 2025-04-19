# Supabase Setup Instructions

This directory contains the SQL schema and policies for setting up your Supabase database.

## Quick Setup (Recommended)

For a complete setup in one step:

1. Go to your Supabase project dashboard: https://app.supabase.com/project/_/sql
2. Click on "SQL Editor"
3. Click "New Query"
4. Copy and paste the contents of `setup.sql` into the editor
5. Click "Run" to execute the SQL

This will create all tables, enable RLS, create storage buckets, and apply all security policies in one go.

## Individual Setup Files

If you prefer to apply the setup in stages, you can use these individual files:

- `schema.sql` - Creates the database tables
- `storage-policies.sql` - Sets up storage buckets and policies
- `rls-policies.sql` - Applies Row Level Security policies

## Storage Buckets Setup

After setting up your database schema, you'll need to create storage buckets:

1. Go to the "Storage" section in your Supabase dashboard
2. Create two new buckets:
   - `owner-docs` - For restaurant owner documents
   - `driver-docs` - For driver documents

## Row Level Security (RLS) Policies

The schema enables Row Level Security on all tables. You should apply the RLS policies defined in `rls-policies.sql` to secure your data.

To apply these policies:

1. Go to your Supabase project dashboard: https://app.supabase.com/project/_/sql
2. Click on "SQL Editor"
3. Click "New Query"
4. Copy and paste the contents of `rls-policies.sql` into the editor
5. Click "Run" to execute the SQL

These policies implement the following security rules:

- Users can only view and update their own data
- Restaurant owners can manage their own restaurants, locations, and menu items
- Customers can view active restaurants and create/view their own orders
- Drivers can view and update orders assigned to them
- Admins have full access to all tables
- Public users can view active restaurants, open locations, and menu items

## Environment Variables

Make sure your `.env` file contains the correct Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://hucwmarfibagwpybmzbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

Replace `your_actual_anon_key` with your real Supabase anon key from the API settings in your Supabase dashboard.

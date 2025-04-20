-- Database functions to bypass RLS for specific operations

-- Function to get a user profile by ID
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  current_suburb TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role, u.name, u.phone, u.address, u.current_suburb, u.created_at, u.updated_at
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert a user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_phone TEXT,
  user_address TEXT,
  user_suburb TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
  auth_user RECORD;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = user_id) INTO user_exists;

  -- Also update the auth.users metadata to ensure consistency
  BEGIN
    UPDATE auth.users
    SET raw_user_meta_data =
      CASE
        WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('name', user_name)
        ELSE jsonb_set(raw_user_meta_data, '{name}', to_jsonb(user_name))
      END
    WHERE id = user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors updating auth.users as we may not have permission
    RAISE NOTICE 'Could not update auth.users metadata: %', SQLERRM;
  END;

  IF user_exists THEN
    -- Update existing user
    UPDATE users
    SET
      name = user_name,
      role = user_role,
      phone = user_phone,
      address = user_address,
      current_suburb = user_suburb,
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Insert new user
    INSERT INTO users (
      id,
      email,
      name,
      role,
      phone,
      address,
      current_suburb,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      user_name,
      user_role,
      user_phone,
      user_address,
      user_suburb,
      NOW(),
      NOW()
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

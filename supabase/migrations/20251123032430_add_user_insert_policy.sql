/*
  # Add INSERT Policy for Users Table and Client Folders
  
  This migration adds RLS policies to allow admins and managers to create client users
  within their organization, and creates default folders for new clients.
  
  This migration is idempotent - safe to run multiple times.
*/

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins and managers can create client users" ON users;
DROP POLICY IF EXISTS "Admins and managers can update client users" ON users;
DROP POLICY IF EXISTS "Users can view client folders" ON client_folders;
DROP POLICY IF EXISTS "Admins can manage client folders" ON client_folders;

-- Drop function and trigger if they exist
DROP TRIGGER IF EXISTS trigger_create_default_client_folders ON users;
DROP FUNCTION IF EXISTS create_default_client_folders();

-- Allow admins and managers to INSERT client users in their organization
CREATE POLICY "Admins and managers can create client users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow creating users with role 'client'
    role = 'client'
    AND
    -- The organization_id must match the admin/manager's organization
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id IS NOT NULL
    )
    AND
    -- The organization_id being set must exist
    organization_id IN (SELECT id FROM organizations)
  );

-- Allow admins and managers to UPDATE client users in their organization
CREATE POLICY "Admins and managers can update client users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    -- Can update users in their organization
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id IS NOT NULL
    )
  )
  WITH CHECK (
    -- Ensure the updated organization_id still matches their organization
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id IS NOT NULL
    )
  );

-- =====================================================
-- RLS POLICIES - CLIENT FOLDERS
-- =====================================================

-- Allow users to view client folders in their organization
CREATE POLICY "Users can view client folders"
  ON client_folders FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
    OR
    client_id = auth.uid()
  );

-- Allow admins and managers to manage client folders
CREATE POLICY "Admins can manage client folders"
  ON client_folders FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id IS NOT NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND organization_id IS NOT NULL
    )
  );

-- =====================================================
-- FUNCTION: Create Default Folders for New Client
-- =====================================================

-- Function to create default folders when a client is created
CREATE OR REPLACE FUNCTION create_default_client_folders()
RETURNS TRIGGER AS $$
DECLARE
  folder_types text[] := ARRAY['kyc', 'legal', 'finance', 'hr'];
  folder_names text[] := ARRAY['KYC Documents', 'Legal Documents', 'Finance Documents', 'HR Documents'];
  i int;
BEGIN
  -- Only create folders for client users
  IF NEW.role = 'client' AND NEW.organization_id IS NOT NULL THEN
    -- Create default folders
    FOR i IN 1..array_length(folder_types, 1) LOOP
      INSERT INTO client_folders (
        organization_id,
        client_id,
        name,
        folder_type,
        description,
        sort_order,
        created_by
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        folder_names[i],
        folder_types[i],
        'Default ' || folder_names[i] || ' folder',
        i,
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create folders when a client user is inserted
DROP TRIGGER IF EXISTS trigger_create_default_client_folders ON users;
CREATE TRIGGER trigger_create_default_client_folders
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_client_folders();


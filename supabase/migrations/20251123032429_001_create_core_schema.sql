/*
  # FollowUp AI - Core Database Schema

  ## Overview
  This migration creates the foundational database structure for FollowUp AI, an enterprise automation platform for document collection, verification, and task management.

  ## Tables Created

  ### 1. Organizations & Users
  - `organizations` - Firms/companies using the platform (CA firms, lending institutions, HR departments)
  - `users` - All platform users with role-based access
  - `user_roles` - Role assignments for users within organizations

  ### 2. Template System
  - `template_categories` - Categories like GST, Income Tax, KYC, HR, Vendor, Loan
  - `templates` - Reusable templates with linked tasks and checklist definitions
  - `template_checklist_items` - Individual document/data requirements within templates

  ### 3. Task Management
  - `tasks` - Both one-time and recurring tasks with scheduler configuration
  - `task_occurrences` - Auto-generated instances of recurring tasks
  - `task_assignments` - Team member assignments to tasks

  ### 4. Data Requests & Checklists
  - `data_requests` - Client-specific document/information requests
  - `request_checklist_items` - Specific items to collect per request with status tracking

  ### 5. Client Vault & Documents
  - `client_folders` - Folder structure (KYC, Legal, Finance, HR, etc.)
  - `documents` - Document metadata with version tracking
  - `document_versions` - Version history for each document

  ### 6. Communication & Reminders
  - `reminders` - Scheduled reminders for tasks and requests
  - `notifications` - All notifications sent to users
  - `voice_call_logs` - AI voice agent call records and transcripts

  ### 7. Approvals & Audit
  - `approvals` - Maker-checker approval workflow records
  - `audit_trail` - Complete audit log of all actions

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for multi-tenant data isolation
  - Authenticated user access controls
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS & USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('ca_firm', 'lending', 'hr', 'legal', 'vendor_onboarding', 'other')),
  email text,
  phone text,
  address text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'team_member', 'client')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TEMPLATE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS template_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES template_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('one_time', 'recurring')),
  
  -- Scheduler configuration (for recurring tasks)
  schedule_frequency text CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  schedule_day_rule text,
  schedule_start_date date,
  schedule_end_date date,
  pre_due_reminders jsonb DEFAULT '[]',
  
  -- Task settings
  default_assignee_role text,
  task_manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  default_sla_days int DEFAULT 7,
  visibility text DEFAULT 'client_facing' CHECK (visibility IN ('internal_only', 'client_facing')),
  
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  version int DEFAULT 1,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS template_checklist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  particular text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('id_proof', 'address_proof', 'financial_statement', 'agreement', 'certificate', 'tax_document', 'compliance_document', 'other')),
  is_mandatory boolean DEFAULT true,
  allow_multiple_uploads boolean DEFAULT false,
  auto_link_vault boolean DEFAULT true,
  expiry_rule jsonb,
  dependency_item_id uuid REFERENCES template_checklist_items(id) ON DELETE SET NULL,
  default_assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  instructions text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TASK MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  client_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  name text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('one_time', 'recurring')),
  
  -- Scheduler (for recurring)
  schedule_frequency text CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  schedule_day_rule text,
  schedule_start_date date,
  schedule_end_date date,
  next_run_date date,
  
  task_manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'waiting_on_client', 'completed', 'overdue', 'cancelled')),
  
  due_date date,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_occurrences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'skipped')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, occurrence_date)
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(task_id, user_id)
);

-- =====================================================
-- DATA REQUESTS & CHECKLISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS data_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  request_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'cancelled')),
  
  -- Communication channels
  enable_email boolean DEFAULT true,
  enable_whatsapp boolean DEFAULT false,
  enable_voice boolean DEFAULT false,
  
  sent_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_checklist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id uuid REFERENCES data_requests(id) ON DELETE CASCADE,
  template_item_id uuid REFERENCES template_checklist_items(id) ON DELETE SET NULL,
  
  sort_order int NOT NULL,
  particular text NOT NULL,
  document_type text NOT NULL,
  is_mandatory boolean DEFAULT true,
  allow_multiple_uploads boolean DEFAULT false,
  
  status text DEFAULT 'not_received' CHECK (status IN ('not_received', 'received', 'under_review', 'approved', 'rejected', 're_requested')),
  client_comments text,
  internal_comments text,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CLIENT VAULT & DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS client_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES client_folders(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  folder_type text CHECK (folder_type IN ('kyc', 'legal', 'finance', 'hr', 'project', 'custom')),
  description text,
  sort_order int DEFAULT 0,
  
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES client_folders(id) ON DELETE SET NULL,
  request_item_id uuid REFERENCES request_checklist_items(id) ON DELETE SET NULL,
  
  name text NOT NULL,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  
  -- AI extracted metadata
  extracted_data jsonb DEFAULT '{}',
  classification_confidence decimal(3,2),
  
  -- Document details
  document_number text,
  issue_date date,
  expiry_date date,
  is_expired boolean DEFAULT false,
  
  tags text[] DEFAULT '{}',
  version int DEFAULT 1,
  current_version_id uuid,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'flagged')),
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  changes_description text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- =====================================================
-- COMMUNICATION & REMINDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  reminder_type text NOT NULL CHECK (reminder_type IN ('task', 'request', 'document_expiry', 'custom')),
  related_id uuid,
  
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'voice', 'in_app')),
  
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  message_subject text,
  message_body text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_call_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  request_id uuid REFERENCES data_requests(id) ON DELETE SET NULL,
  
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  
  call_sid text UNIQUE,
  call_status text CHECK (call_status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'no_answer', 'busy')),
  
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  
  transcript text,
  call_outcome text,
  next_action text,
  next_reminder_date timestamptz,
  
  recording_url text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- APPROVALS & AUDIT
-- =====================================================

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  approval_type text NOT NULL CHECK (approval_type IN ('document', 'request_item', 'request', 'task')),
  related_id uuid NOT NULL,
  
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz DEFAULT now(),
  
  reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  
  action text CHECK (action IN ('approved', 'rejected', 're_request')),
  remarks text,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  
  performed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  performed_at timestamptz DEFAULT now(),
  
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  
  ip_address inet,
  user_agent text,
  
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_templates_organization ON templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_client ON data_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_reminders_recipient ON reminders(recipient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ORGANIZATIONS
-- =====================================================

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - USERS
-- =====================================================

CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- RLS POLICIES - TEMPLATES
-- =====================================================

CREATE POLICY "Users can view templates in their organization"
  ON templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can manage templates"
  ON templates FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- =====================================================
-- RLS POLICIES - TASKS
-- =====================================================

CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR client_id = auth.uid()
  );

CREATE POLICY "Team members can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'team_member')
    )
  );

-- =====================================================
-- RLS POLICIES - DATA REQUESTS
-- =====================================================

CREATE POLICY "Users can view their requests"
  ON data_requests FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'team_member')
    )
  );

CREATE POLICY "Team members can manage requests"
  ON data_requests FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'team_member')
    )
  );

-- =====================================================
-- RLS POLICIES - DOCUMENTS
-- =====================================================

CREATE POLICY "Users can view their documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'team_member')
    )
  );

CREATE POLICY "Clients can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Team members can manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'team_member')
    )
  );

-- =====================================================
-- RLS POLICIES - NOTIFICATIONS
-- =====================================================

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES - AUDIT TRAIL
-- =====================================================

CREATE POLICY "Admins can view audit trail"
  ON audit_trail FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );
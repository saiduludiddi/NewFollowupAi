export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: 'ca_firm' | 'lending' | 'hr' | 'legal' | 'vendor_onboarding' | 'other';
          email: string | null;
          phone: string | null;
          address: string | null;
          settings: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'super_admin' | 'admin' | 'manager' | 'team_member' | 'client';
          is_active: boolean;
          last_login: string | null;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      template_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['template_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['template_categories']['Insert']>;
      };
      templates: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          task_type: 'one_time' | 'recurring';
          schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | null;
          schedule_day_rule: string | null;
          schedule_start_date: string | null;
          schedule_end_date: string | null;
          pre_due_reminders: any[];
          default_assignee_role: string | null;
          task_manager_id: string | null;
          priority: 'low' | 'medium' | 'high';
          default_sla_days: number;
          visibility: 'internal_only' | 'client_facing';
          status: 'active' | 'inactive' | 'archived';
          version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['templates']['Insert']>;
      };
      template_checklist_items: {
        Row: {
          id: string;
          template_id: string;
          sort_order: number;
          particular: string;
          document_type: 'id_proof' | 'address_proof' | 'financial_statement' | 'agreement' | 'certificate' | 'tax_document' | 'compliance_document' | 'other';
          is_mandatory: boolean;
          allow_multiple_uploads: boolean;
          auto_link_vault: boolean;
          expiry_rule: Record<string, any> | null;
          dependency_item_id: string | null;
          default_assignee_id: string | null;
          instructions: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['template_checklist_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['template_checklist_items']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string | null;
          client_id: string | null;
          name: string;
          description: string | null;
          task_type: 'one_time' | 'recurring';
          schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | null;
          schedule_day_rule: string | null;
          schedule_start_date: string | null;
          schedule_end_date: string | null;
          next_run_date: string | null;
          task_manager_id: string | null;
          priority: 'low' | 'medium' | 'high';
          status: 'not_started' | 'in_progress' | 'waiting_on_client' | 'completed' | 'overdue' | 'cancelled';
          due_date: string | null;
          completed_at: string | null;
          metadata: Record<string, any>;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      data_requests: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string | null;
          task_id: string | null;
          client_id: string;
          request_number: string;
          title: string;
          description: string | null;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high';
          status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled';
          enable_email: boolean;
          enable_whatsapp: boolean;
          enable_voice: boolean;
          sent_at: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['data_requests']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          folder_id: string | null;
          request_item_id: string | null;
          name: string;
          document_type: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          extracted_data: Record<string, any>;
          classification_confidence: number | null;
          document_number: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          is_expired: boolean;
          tags: string[];
          version: number;
          current_version_id: string | null;
          status: 'active' | 'archived' | 'deleted';
          verification_status: 'pending' | 'verified' | 'rejected' | 'flagged';
          verified_by: string | null;
          verified_at: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
    };
  };
};

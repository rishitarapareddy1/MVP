export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_submissions: {
        Row: {
          assessment_id: string;
          created_at: string;
          graded_at: string | null;
          grader_notes: string | null;
          id: string;
          rubric_scores: Json | null;
          status: Database["public"]["Enums"]["assessment_status"];
          student_id: string;
          submission_path: string | null;
          submission_url: string | null;
          total_score: number | null;
          updated_at: string;
        };
        Insert: {
          assessment_id: string;
          created_at?: string;
          graded_at?: string | null;
          grader_notes?: string | null;
          id?: string;
          rubric_scores?: Json | null;
          status?: Database["public"]["Enums"]["assessment_status"];
          student_id: string;
          submission_path?: string | null;
          submission_url?: string | null;
          total_score?: number | null;
          updated_at?: string;
        };
        Update: {
          assessment_id?: string;
          created_at?: string;
          graded_at?: string | null;
          grader_notes?: string | null;
          id?: string;
          rubric_scores?: Json | null;
          status?: Database["public"]["Enums"]["assessment_status"];
          student_id?: string;
          submission_path?: string | null;
          submission_url?: string | null;
          total_score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          category: Database["public"]["Enums"]["project_category"];
          created_at: string;
          id: string;
          instructions: string;
          is_active: boolean;
          pass_threshold: number;
          resource_path: string | null;
          rubric: Json;
          time_limit_minutes: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          id?: string;
          instructions: string;
          is_active?: boolean;
          pass_threshold: number;
          resource_path?: string | null;
          rubric?: Json;
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          id?: string;
          instructions?: string;
          is_active?: boolean;
          pass_threshold?: number;
          resource_path?: string | null;
          rubric?: Json;
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          contact_email: string;
          contact_name: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          industry: string | null;
          name: string;
          notes: string | null;
          source: string | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          contact_email: string;
          contact_name: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          industry?: string | null;
          name: string;
          notes?: string | null;
          source?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          contact_email?: string;
          contact_name?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          industry?: string | null;
          name?: string;
          notes?: string | null;
          source?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      deliverables: {
        Row: {
          created_at: string;
          file_path: string | null;
          id: string;
          note: string | null;
          project_id: string;
          student_id: string;
          submitted_at: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          file_path?: string | null;
          id?: string;
          note?: string | null;
          project_id: string;
          student_id: string;
          submitted_at?: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          file_path?: string | null;
          id?: string;
          note?: string | null;
          project_id?: string;
          student_id?: string;
          submitted_at?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliverables_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "student_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliverables_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      email_verification_codes: {
        Row: {
          attempts: number;
          code_hash: string;
          created_at: string;
          email: string;
          expires_at: string;
          last_sent_at: string;
          sends_in_window: number;
          student_id: string;
          updated_at: string;
          window_started_at: string;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          created_at?: string;
          email: string;
          expires_at: string;
          last_sent_at?: string;
          sends_in_window?: number;
          student_id: string;
          updated_at?: string;
          window_started_at?: string;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          last_sent_at?: string;
          sends_in_window?: number;
          student_id?: string;
          updated_at?: string;
          window_started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_verification_codes_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          created_at: string;
          followed_up_at: string | null;
          id: string;
          interested_in_internship_or_job: boolean;
          project_id: string;
          quality_notes: string | null;
          rating: number;
          submitted_at: string;
          updated_at: string;
          would_hire_again: boolean;
        };
        Insert: {
          created_at?: string;
          followed_up_at?: string | null;
          id?: string;
          interested_in_internship_or_job: boolean;
          project_id: string;
          quality_notes?: string | null;
          rating: number;
          submitted_at?: string;
          updated_at?: string;
          would_hire_again: boolean;
        };
        Update: {
          created_at?: string;
          followed_up_at?: string | null;
          id?: string;
          interested_in_internship_or_job?: boolean;
          project_id?: string;
          quality_notes?: string | null;
          rating?: number;
          submitted_at?: string;
          updated_at?: string;
          would_hire_again?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "student_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          admin_note: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          match_breakdown: Json;
          match_score: number;
          project_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["offer_status"];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          match_breakdown?: Json;
          match_score: number;
          project_id: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["offer_status"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          match_breakdown?: Json;
          match_score?: number;
          project_id?: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["offer_status"];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "student_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      outcomes: {
        Row: {
          business_id: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          occurred_at: string;
          project_id: string | null;
          student_id: string;
          type: Database["public"]["Enums"]["outcome_type"];
          updated_at: string;
        };
        Insert: {
          business_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          occurred_at?: string;
          project_id?: string | null;
          student_id: string;
          type: Database["public"]["Enums"]["outcome_type"];
          updated_at?: string;
        };
        Update: {
          business_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          occurred_at?: string;
          project_id?: string | null;
          student_id?: string;
          type?: Database["public"]["Enums"]["outcome_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outcomes_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outcomes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outcomes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "student_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outcomes_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          direction: string;
          id: string;
          method: string;
          paid_at: string;
          project_id: string;
          reference: string | null;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          direction: string;
          id?: string;
          method: string;
          paid_at?: string;
          project_id: string;
          reference?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          direction?: string;
          id?: string;
          method?: string;
          paid_at?: string;
          project_id?: string;
          reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "student_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          assigned_student_id: string | null;
          budget_cents: number | null;
          budget_range: string | null;
          business_id: string;
          category: Database["public"]["Enums"]["project_category"];
          created_at: string;
          deadline: string | null;
          deliverable: string | null;
          estimated_hours: number | null;
          feedback_token: string;
          id: string;
          is_starter: boolean;
          preferred_skills: string[];
          raw_request: string;
          required_skills: string[];
          scoped_description: string | null;
          status: Database["public"]["Enums"]["project_status"];
          student_pay_cents: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_student_id?: string | null;
          budget_cents?: number | null;
          budget_range?: string | null;
          business_id: string;
          category?: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          deadline?: string | null;
          deliverable?: string | null;
          estimated_hours?: number | null;
          feedback_token?: string;
          id?: string;
          is_starter?: boolean;
          preferred_skills?: string[];
          raw_request: string;
          required_skills?: string[];
          scoped_description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          student_pay_cents?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_student_id?: string | null;
          budget_cents?: number | null;
          budget_range?: string | null;
          business_id?: string;
          category?: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          deadline?: string | null;
          deliverable?: string | null;
          estimated_hours?: number | null;
          feedback_token?: string;
          id?: string;
          is_starter?: boolean;
          preferred_skills?: string[];
          raw_request?: string;
          required_skills?: string[];
          scoped_description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          student_pay_cents?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_assigned_student_id_fkey";
            columns: ["assigned_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          bio: string | null;
          created_at: string;
          graduation_year: number | null;
          hours_per_week: number | null;
          id: string;
          interested_categories: Database["public"]["Enums"]["project_category"][];
          is_active: boolean;
          is_available: boolean;
          major: string | null;
          portfolio_links: string[];
          resume_path: string | null;
          skills: string[];
          university_email: string | null;
          university_email_verified_at: string | null;
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          graduation_year?: number | null;
          hours_per_week?: number | null;
          id: string;
          interested_categories?: Database["public"]["Enums"]["project_category"][];
          is_active?: boolean;
          is_available?: boolean;
          major?: string | null;
          portfolio_links?: string[];
          resume_path?: string | null;
          skills?: string[];
          university_email?: string | null;
          university_email_verified_at?: string | null;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          graduation_year?: number | null;
          hours_per_week?: number | null;
          id?: string;
          interested_categories?: Database["public"]["Enums"]["project_category"][];
          is_active?: boolean;
          is_available?: boolean;
          major?: string | null;
          portfolio_links?: string[];
          resume_path?: string | null;
          skills?: string[];
          university_email?: string | null;
          university_email_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      student_projects: {
        Row: {
          assigned_student_id: string | null;
          category: Database["public"]["Enums"]["project_category"] | null;
          deadline: string | null;
          deliverable: string | null;
          estimated_hours: number | null;
          id: string | null;
          is_starter: boolean | null;
          preferred_skills: string[] | null;
          required_skills: string[] | null;
          scoped_description: string | null;
          status: Database["public"]["Enums"]["project_status"] | null;
          student_pay_cents: number | null;
          title: string | null;
        };
        Insert: {
          assigned_student_id?: string | null;
          category?: Database["public"]["Enums"]["project_category"] | null;
          deadline?: string | null;
          deliverable?: string | null;
          estimated_hours?: number | null;
          id?: string | null;
          is_starter?: boolean | null;
          preferred_skills?: string[] | null;
          required_skills?: string[] | null;
          scoped_description?: string | null;
          status?: Database["public"]["Enums"]["project_status"] | null;
          student_pay_cents?: number | null;
          title?: string | null;
        };
        Update: {
          assigned_student_id?: string | null;
          category?: Database["public"]["Enums"]["project_category"] | null;
          deadline?: string | null;
          deliverable?: string | null;
          estimated_hours?: number | null;
          id?: string | null;
          is_starter?: boolean | null;
          preferred_skills?: string[] | null;
          required_skills?: string[] | null;
          scoped_description?: string | null;
          status?: Database["public"]["Enums"]["project_status"] | null;
          student_pay_cents?: number | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_assigned_student_id_fkey";
            columns: ["assigned_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_offer: { Args: { p_offer_id: string }; Returns: string };
      can_submit_assessment: {
        Args: { p_assessment_id: string };
        Returns: boolean;
      };
      can_submit_deliverable: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      decline_offer: { Args: { p_offer_id: string }; Returns: string };
      expire_stale_offers: { Args: never; Returns: number };
      is_admin: { Args: never; Returns: boolean };
      is_assigned_project_folder: {
        Args: { p_folder: string };
        Returns: boolean;
      };
      is_student: { Args: never; Returns: boolean };
      send_offers: {
        Args: { p_offers: Json; p_project_id: string };
        Returns: number;
      };
      start_project: { Args: { p_project_id: string }; Returns: string };
      submit_deliverable: {
        Args: {
          p_file_path: string;
          p_note: string;
          p_project_id: string;
          p_url: string;
        };
        Returns: string;
      };
      submit_feedback: {
        Args: {
          p_interested: boolean;
          p_quality_notes: string;
          p_rating: number;
          p_token: string;
          p_would_hire_again: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      assessment_status: "submitted" | "passed" | "failed";
      offer_status: "pending" | "accepted" | "declined" | "expired" | "withdrawn";
      outcome_type:
        | "repeat_project"
        | "referral"
        | "internship_interview"
        | "job_interview"
        | "internship_offer"
        | "job_offer"
        | "listed_on_resume"
        | "other";
      project_category:
        | "market_research"
        | "competitor_analysis"
        | "data_cleanup"
        | "data_analysis"
        | "lead_research"
        | "spreadsheet_work"
        | "presentation"
        | "website_qa"
        | "social_media_analysis"
        | "other";
      project_status:
        | "submitted"
        | "scoping"
        | "matching"
        | "offered"
        | "assigned"
        | "in_progress"
        | "delivered"
        | "approved"
        | "paid"
        | "closed"
        | "cancelled";
      user_role: "student" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assessment_status: ["submitted", "passed", "failed"],
      offer_status: ["pending", "accepted", "declined", "expired", "withdrawn"],
      outcome_type: [
        "repeat_project",
        "referral",
        "internship_interview",
        "job_interview",
        "internship_offer",
        "job_offer",
        "listed_on_resume",
        "other",
      ],
      project_category: [
        "market_research",
        "competitor_analysis",
        "data_cleanup",
        "data_analysis",
        "lead_research",
        "spreadsheet_work",
        "presentation",
        "website_qa",
        "social_media_analysis",
        "other",
      ],
      project_status: [
        "submitted",
        "scoping",
        "matching",
        "offered",
        "assigned",
        "in_progress",
        "delivered",
        "approved",
        "paid",
        "closed",
        "cancelled",
      ],
      user_role: ["student", "admin"],
    },
  },
} as const;

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      hackathon_review_emails: {
        Row: {
          id: string;
          registration_id: string;
          payload: Json;
          first_attempt_at: string | null;
          claimed_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          payload: Json;
          first_attempt_at?: string | null;
          claimed_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: { claimed_at?: string | null; sent_at?: string | null };
        Relationships: [];
      };
      achievements: {
        Row: {
          created_at: string;
          description: string | null;
          happened_on: string;
          id: string;
          member_id: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          happened_on?: string;
          id?: string;
          member_id?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          happened_on?: string;
          id?: string;
          member_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          media_type: string | null;
          media_url: string | null;
          pinned: boolean;
          published: boolean;
          team_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          pinned?: boolean;
          published?: boolean;
          team_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          pinned?: boolean;
          published?: boolean;
          team_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          branch: string | null;
          created_at: string;
          email: string;
          id: string;
          links: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          status: string;
          team_first: string | null;
          team_second: string | null;
          updated_at: string;
          usn: string | null;
          why: string | null;
          year: string | null;
        };
        Insert: {
          branch?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          links?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          status?: string;
          team_first?: string | null;
          team_second?: string | null;
          updated_at?: string;
          usn?: string | null;
          why?: string | null;
          year?: string | null;
        };
        Update: {
          branch?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          links?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          status?: string;
          team_first?: string | null;
          team_second?: string | null;
          updated_at?: string;
          usn?: string | null;
          why?: string | null;
          year?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_team_first_fkey";
            columns: ["team_first"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_team_second_fkey";
            columns: ["team_second"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      evaluation_criteria: {
        Row: {
          created_at: string;
          description: string | null;
          event_id: string;
          id: string;
          max_score: number;
          name: string;
          sort_order: number;
          updated_at: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_id: string;
          id?: string;
          max_score?: number;
          name: string;
          sort_order?: number;
          updated_at?: string;
          weight?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          max_score?: number;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluation_scores: {
        Row: {
          created_at: string;
          criterion_id: string;
          feedback: string | null;
          id: string;
          judge_id: string;
          score: number;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          criterion_id: string;
          feedback?: string | null;
          id?: string;
          judge_id: string;
          score: number;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          criterion_id?: string;
          feedback?: string | null;
          id?: string;
          judge_id?: string;
          score?: number;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criterion_id_fkey";
            columns: ["criterion_id"];
            isOneToOne: false;
            referencedRelation: "evaluation_criteria";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evaluation_scores_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "hackathon_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      event_announcements: {
        Row: {
          body: string;
          created_at: string;
          event_id: string;
          id: string;
          pinned: boolean;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          event_id: string;
          id?: string;
          pinned?: boolean;
          published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          pinned?: boolean;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_announcements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_milestones: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string | null;
          event_id: string;
          id: string;
          published: boolean;
          sort_order: number;
          starts_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_id: string;
          id?: string;
          published?: boolean;
          sort_order?: number;
          starts_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_id?: string;
          id?: string;
          published?: boolean;
          sort_order?: number;
          starts_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_milestones_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          reconsidering: boolean;
          reversal_reason: string | null;
          previous_status: string | null;
          review_note: string | null;
          email_sent_at: string | null;
          code: string;
          status: "pending" | "approved" | "rejected" | "waitlisted";
          form_data: Json;
          reviewed_at: string | null;
          reviewed_by: string | null;
          pass_sent_at: string | null;
          pass_sent_to: string | null;
          workspace_registration: Json | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
          email: string;
          event_id: string;
          id: string;
          name: string;
          phone: string | null;
          usn: string | null;
        };
        Insert: {
          reconsidering?: boolean;
          reversal_reason?: string | null;
          previous_status?: string | null;
          review_note?: string | null;
          email_sent_at?: string | null;
          status?: "pending" | "approved" | "rejected" | "waitlisted";
          form_data?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          pass_sent_at?: string | null;
          pass_sent_to?: string | null;
          workspace_registration?: Json | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          code?: string;
          created_at?: string;
          email: string;
          event_id: string;
          id?: string;
          name: string;
          phone?: string | null;
          usn?: string | null;
        };
        Update: {
          reconsidering?: boolean;
          reversal_reason?: string | null;
          previous_status?: string | null;
          review_note?: string | null;
          email_sent_at?: string | null;
          status?: "pending" | "approved" | "rejected" | "waitlisted";
          form_data?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          pass_sent_at?: string | null;
          pass_sent_to?: string | null;
          workspace_registration?: Json | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          code?: string;
          created_at?: string;
          email?: string;
          event_id?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          usn?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_operation_settings: {
        Row: {
          event_id: string;
          registration_mode: "individual" | "team" | "disabled";
          registration_open: boolean;
          registration_opens_at: string | null;
          registration_closes_at: string | null;
          requires_approval: boolean;
          waitlist_enabled: boolean;
          passes_enabled: boolean;
          checkin_enabled: boolean;
          email_enabled: boolean;
          team_min_size: number;
          team_max_size: number;
          submissions_enabled: boolean;
          judging_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          registration_mode?: "individual" | "team" | "disabled";
          registration_open?: boolean;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          requires_approval?: boolean;
          waitlist_enabled?: boolean;
          passes_enabled?: boolean;
          checkin_enabled?: boolean;
          email_enabled?: boolean;
          team_min_size?: number;
          team_max_size?: number;
          submissions_enabled?: boolean;
          judging_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          registration_mode?: "individual" | "team" | "disabled";
          registration_open?: boolean;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          requires_approval?: boolean;
          waitlist_enabled?: boolean;
          passes_enabled?: boolean;
          checkin_enabled?: boolean;
          email_enabled?: boolean;
          team_min_size?: number;
          team_max_size?: number;
          submissions_enabled?: boolean;
          judging_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_staff_access: {
        Row: {
          id: string;
          event_id: string;
          email: string;
          permission: "manager" | "checkin" | "viewer";
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          email: string;
          permission: "manager" | "checkin" | "viewer";
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          email?: string;
          permission?: "manager" | "checkin" | "viewer";
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registration_fields: {
        Row: {
          id: string;
          event_id: string;
          field_key: string;
          label: string;
          field_type: string;
          required: boolean;
          active: boolean;
          options: Json;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          field_key: string;
          label: string;
          field_type?: string;
          required?: boolean;
          active?: boolean;
          options?: Json;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          field_key?: string;
          label?: string;
          field_type?: string;
          required?: boolean;
          active?: boolean;
          options?: Json;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      neural_network_workshop_registration_activity: {
        Row: {
          id: string;
          registration_id: string;
          action: "approved" | "rejected" | "pass_sent" | "pass_resent";
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          action: "approved" | "rejected" | "pass_sent" | "pass_resent";
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          action?: "approved" | "rejected" | "pass_sent" | "pass_resent";
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_workspaces: {
        Row: {
          created_at: string;
          event_id: string;
          max_team_size: number;
          min_team_size: number;
          published: boolean;
          registration_open: boolean;
          rules: string | null;
          submissions_open: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          max_team_size?: number;
          min_team_size?: number;
          published?: boolean;
          registration_open?: boolean;
          rules?: string | null;
          submissions_open?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          max_team_size?: number;
          min_team_size?: number;
          published?: boolean;
          registration_open?: boolean;
          rules?: string | null;
          submissions_open?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_workspaces_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          event_date: string | null;
          id: string;
          location: string;
          published: boolean;
          schedule_tba: boolean;
          slug: string;
          start_time: string | null;
          tag: string;
          title: string;
          updated_at: string;
          workspace_kind: string | null;
        };
        Insert: {
          capacity?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          id?: string;
          location?: string;
          published?: boolean;
          schedule_tba?: boolean;
          slug: string;
          start_time?: string | null;
          tag?: string;
          title: string;
          updated_at?: string;
          workspace_kind?: string | null;
        };
        Update: {
          capacity?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          id?: string;
          location?: string;
          published?: boolean;
          schedule_tba?: boolean;
          slug?: string;
          start_time?: string | null;
          tag?: string;
          title?: string;
          updated_at?: string;
          workspace_kind?: string | null;
        };
        Relationships: [];
      };
      hackathon_activities: {
        Row: {
          activity_type: string;
          created_at: string;
          id: string;
          metadata: Json;
          summary: string;
          team_id: string;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          summary: string;
          team_id: string;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          summary?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_activities_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "hackathon_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      hackathon_problem_statements: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          event_id: string;
          id: string;
          organization: string | null;
          published: boolean;
          sort_order: number;
          source_url: string | null;
          source_version: string | null;
          statement_code: string;
          theme: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          event_id: string;
          id?: string;
          organization?: string | null;
          published?: boolean;
          sort_order?: number;
          source_url?: string | null;
          source_version?: string | null;
          statement_code: string;
          theme?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          organization?: string | null;
          published?: boolean;
          sort_order?: number;
          source_url?: string | null;
          source_version?: string | null;
          statement_code?: string;
          theme?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_problem_statements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      hackathon_submissions: {
        Row: {
          created_at: string;
          deck_path: string | null;
          demo_url: string | null;
          document_paths: string[];
          finalized_at: string | null;
          finalized_by_token_hash: string | null;
          id: string;
          problem_statement_id: string | null;
          problem_statement_title: string | null;
          published: boolean;
          repository_url: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          solution_summary: string | null;
          solution_title: string | null;
          status: string;
          submitted_at: string | null;
          team_id: string;
          theme: string | null;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          created_at?: string;
          deck_path?: string | null;
          demo_url?: string | null;
          document_paths?: string[];
          finalized_at?: string | null;
          finalized_by_token_hash?: string | null;
          id?: string;
          problem_statement_id?: string | null;
          problem_statement_title?: string | null;
          published?: boolean;
          repository_url?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          solution_summary?: string | null;
          solution_title?: string | null;
          status?: string;
          submitted_at?: string | null;
          team_id: string;
          theme?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          created_at?: string;
          deck_path?: string | null;
          demo_url?: string | null;
          document_paths?: string[];
          finalized_at?: string | null;
          finalized_by_token_hash?: string | null;
          id?: string;
          problem_statement_id?: string | null;
          problem_statement_title?: string | null;
          published?: boolean;
          repository_url?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          solution_summary?: string | null;
          solution_title?: string | null;
          status?: string;
          submitted_at?: string | null;
          team_id?: string;
          theme?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_submissions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: true;
            referencedRelation: "hackathon_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      hackathon_checkins: {
        Row: {
          checked_in_at: string;
          checked_in_by: string | null;
          event_id: string;
          id: string;
          method: string;
          note: string | null;
          team_id: string;
        };
        Insert: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          event_id: string;
          id?: string;
          method?: string;
          note?: string | null;
          team_id: string;
        };
        Update: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          event_id?: string;
          id?: string;
          method?: string;
          note?: string | null;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_checkins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hackathon_checkins_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "hackathon_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      hackathon_team_members: {
        Row: {
          branch: string | null;
          created_at: string;
          email: string;
          gender: string | null;
          id: string;
          is_lead: boolean;
          member_token_hash: string | null;
          name: string;
          phone: string | null;
          team_id: string;
          updated_at: string;
          usn: string | null;
          year: string | null;
        };
        Insert: {
          branch?: string | null;
          created_at?: string;
          email: string;
          gender?: string | null;
          id?: string;
          is_lead?: boolean;
          name: string;
          phone?: string | null;
          team_id: string;
          updated_at?: string;
          usn?: string | null;
          year?: string | null;
        };
        Update: {
          branch?: string | null;
          created_at?: string;
          email?: string;
          gender?: string | null;
          id?: string;
          is_lead?: boolean;
          name?: string;
          phone?: string | null;
          team_id?: string;
          updated_at?: string;
          usn?: string | null;
          year?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "hackathon_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      hackathon_teams: {
        Row: {
          checkin_token_hash: string | null;
          college: string | null;
          created_at: string;
          event_id: string;
          id: string;
          lead_email: string;
          lead_name: string;
          lead_phone: string | null;
          join_code: string;
          management_token_hash: string;
          mentor_email: string | null;
          mentor_name: string | null;
          name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          checkin_token_hash?: string | null;
          college?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          lead_email: string;
          lead_name: string;
          lead_phone?: string | null;
          join_code: string;
          management_token_hash: string;
          mentor_email?: string | null;
          mentor_name?: string | null;
          name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          checkin_token_hash?: string | null;
          college?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          lead_email?: string;
          lead_name?: string;
          lead_phone?: string | null;
          management_token_hash?: string;
          mentor_email?: string | null;
          mentor_name?: string | null;
          name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hackathon_teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      member_badges: {
        Row: {
          awarded_on: string;
          badge_id: string;
          member_id: string;
          note: string | null;
        };
        Insert: {
          awarded_on?: string;
          badge_id: string;
          member_id: string;
          note?: string | null;
        };
        Update: {
          awarded_on?: string;
          badge_id?: string;
          member_id?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_badges_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          bio: string | null;
          created_at: string;
          id: string;
          is_head: boolean;
          is_leadership: boolean;
          links: Json;
          name: string;
          photo_path: string | null;
          photo_url: string | null;
          role: string;
          skills: string[];
          slug: string;
          sort_order: number;
          team_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          is_head?: boolean;
          is_leadership?: boolean;
          links?: Json;
          name: string;
          photo_path?: string | null;
          photo_url?: string | null;
          role?: string;
          skills?: string[];
          slug: string;
          sort_order?: number;
          team_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          is_head?: boolean;
          is_leadership?: boolean;
          links?: Json;
          name?: string;
          photo_path?: string | null;
          photo_url?: string | null;
          role?: string;
          skills?: string[];
          slug?: string;
          sort_order?: number;
          team_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      neural_network_workshop_registrations: {
        Row: {
          attend_reason: string;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
          department: string;
          email: string;
          expectation: string;
          id: string;
          name: string;
          pass_sent_at: string | null;
          phone: string;
          qr_token: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          srn: string;
          status: string;
          year: string;
        };
        Insert: {
          attend_reason: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          department: string;
          email: string;
          expectation: string;
          id?: string;
          name: string;
          pass_sent_at?: string | null;
          phone: string;
          qr_token?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          srn: string;
          status?: string;
          year: string;
        };
        Update: {
          attend_reason?: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          department?: string;
          email?: string;
          expectation?: string;
          id?: string;
          name?: string;
          pass_sent_at?: string | null;
          phone?: string;
          qr_token?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          srn?: string;
          status?: string;
          year?: string;
        };
        Relationships: [];
      };
      neural_network_workshop_staff: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string | null;
          email: string;
          id: string;
          permission: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          email: string;
          id?: string;
          permission: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          email?: string;
          id?: string;
          permission?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentorship_requests: {
        Row: {
          created_at: string;
          id: string;
          mentee_id: string;
          mentor_id: string;
          message: string | null;
          status: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mentee_id: string;
          mentor_id: string;
          message?: string | null;
          status?: string;
          topic: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mentee_id?: string;
          mentor_id?: string;
          message?: string | null;
          status?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_mentee_id_fkey";
            columns: ["mentee_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      project_contributors: {
        Row: {
          member_id: string;
          project_id: string;
        };
        Insert: {
          member_id: string;
          project_id: string;
        };
        Update: {
          member_id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_contributors_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_contributors_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          cover_path: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          link: string | null;
          published: boolean;
          slug: string;
          tech: string[];
          title: string;
          year: number | null;
        };
        Insert: {
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          published?: boolean;
          slug: string;
          tech?: string[];
          title: string;
          year?: number | null;
        };
        Update: {
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          published?: boolean;
          slug?: string;
          tech?: string[];
          title?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          blurb: string | null;
          code: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          blurb?: string | null;
          code: string;
          id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          blurb?: string | null;
          code?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      staff_invites: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          label: string | null;
          max_uses: number;
          revoked: boolean;
          role: string;
          used_count: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          max_uses?: number;
          revoked?: boolean;
          role: string;
          used_count?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          max_uses?: number;
          revoked?: boolean;
          role?: string;
          used_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "staff_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_hackathon_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      queue_sarvam_reconsideration: {
        Args: { p_id: string; p_queued: boolean };
        Returns: boolean;
      };
      reconsider_sarvam_submission: {
        Args: {
          p_id: string;
          p_status: string;
          p_reviewer: string;
          p_note: string;
          p_payload: Json;
        };
        Returns: boolean;
      };
      review_sarvam_submission: {
        Args: {
          p_id: string;
          p_status: string;
          p_reviewer: string;
          p_note: string;
          p_payload: Json;
        };
        Returns: boolean;
      };
      claim_sarvam_review_email: {
        Args: { p_id: string };
        Returns: Database["public"]["Tables"]["hackathon_review_emails"]["Row"][];
      };
      complete_sarvam_review_email: {
        Args: { p_id: string; p_claimed_at: string };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_head_of: {
        Args: { _team_id: string; _user_id: string };
        Returns: boolean;
      };
      update_sih_team_and_roster: {
        Args: {
          p_lead_email: string;
          p_lead_name: string;
          p_members: Json;
          p_mentor_email: string;
          p_mentor_name: string;
          p_name: string;
          p_team_id: string;
        };
        Returns: undefined;
      };
      create_sih_team: {
        Args: {
          p_event_id: string;
          p_name: string;
          p_lead_name: string;
          p_lead_email: string;
          p_lead_gender: string;
          p_lead_phone: string;
          p_lead_srn: string;
          p_lead_branch: string;
          p_lead_year: string;
          p_problem_statement_id?: string;
        };
        Returns: Json;
      };
      join_sih_team: {
        Args: { p_event_id: string; p_join_code: string; p_member: Json };
        Returns: Json;
      };
      rotate_sih_join_code: {
        Args: { p_management_token: string };
        Returns: string;
      };
      make_sih_join_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      update_sih_member_own: {
        Args: { p_member_token: string; p_member: Json };
        Returns: undefined;
      };
      leave_sih_team: {
        Args: { p_member_token: string };
        Returns: undefined;
      };
      reissue_sih_management_token: {
        Args: { p_team_id: string };
        Returns: string;
      };
      reopen_sih_submission: {
        Args: { p_team_id: string };
        Returns: undefined;
      };
      set_sih_showcase: {
        Args: { p_team_id: string; p_published: boolean };
        Returns: undefined;
      };
      assign_sih_mentor: {
        Args: { p_team_id: string; p_mentor_name: string; p_mentor_email: string };
        Returns: undefined;
      };
      upsert_evaluation_score: {
        Args: {
          p_team_id: string;
          p_criterion_id: string;
          p_judge_id: string;
          p_score: number;
          p_feedback: string;
        };
        Returns: undefined;
      };
      redeem_staff_invite: {
        Args: { p_code: string; p_role: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "head" | "member" | "judge" | "mentor";
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
  public: {
    Enums: {
      app_role: ["admin", "head", "member"],
    },
  },
} as const;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string
          date_achieved: string | null
          description: string | null
          id: string
          metrics: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date_achieved?: string | null
          description?: string | null
          id?: string
          metrics?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date_achieved?: string | null
          description?: string | null
          id?: string
          metrics?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          name: string
          size_category: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          size_category?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          size_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          gpa: number | null
          id: string
          institution: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_resumes: {
        Row: {
          ats_optimization_notes: string[] | null
          ats_score: number | null
          company_target: string | null
          content: Json
          created_at: string
          id: string
          job_description: string | null
          job_title: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ats_optimization_notes?: string[] | null
          ats_score?: number | null
          company_target?: string | null
          content: Json
          created_at?: string
          id?: string
          job_description?: string | null
          job_title?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ats_optimization_notes?: string[] | null
          ats_score?: number | null
          company_target?: string | null
          content?: Json
          created_at?: string
          id?: string
          job_description?: string | null
          job_title?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_analyses: {
        Row: {
          company: string | null
          created_at: string
          critical_areas: string[] | null
          id: string
          job_description: string
          job_title: string
          key_requirements: string[]
          match_score: number
          matched_skills: string[]
          missing_skills: string[]
          recommendations: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          critical_areas?: string[] | null
          id?: string
          job_description: string
          job_title: string
          key_requirements?: string[]
          match_score: number
          matched_skills?: string[]
          missing_skills?: string[]
          recommendations?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          critical_areas?: string[] | null
          id?: string
          job_description?: string
          job_title?: string
          key_requirements?: string[]
          match_score?: number
          matched_skills?: string[]
          missing_skills?: string[]
          recommendations?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_staging: {
        Row: {
          company: string
          created_at: string
          extracted_keywords: Json | null
          id: string
          job_description: string
          job_title: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          extracted_keywords?: Json | null
          id?: string
          job_description: string
          job_title: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          extracted_keywords?: Json | null
          id?: string
          job_description?: string
          job_title?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          impact_metrics: string | null
          start_date: string | null
          technologies_used: string[] | null
          title: string
          updated_at: string
          user_id: string
          work_experience_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          impact_metrics?: string | null
          start_date?: string | null
          technologies_used?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          work_experience_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          impact_metrics?: string | null
          start_date?: string | null
          technologies_used?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          work_experience_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_work_experience_id_fkey"
            columns: ["work_experience_id"]
            isOneToOne: false
            referencedRelation: "work_experiences"
            referencedColumns: ["id"]
          },
        ]
      }

      skills_experience: {
        Row: {
          created_at: string
          id: string
          proficiency_level: string | null
          project_id: string | null
          skill_name: string
          updated_at: string
          user_id: string
          work_experience_id: string | null
          years_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency_level?: string | null
          project_id?: string | null
          skill_name: string
          updated_at?: string
          user_id: string
          work_experience_id?: string | null
          years_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency_level?: string | null
          project_id?: string | null
          skill_name?: string
          updated_at?: string
          user_id?: string
          work_experience_id?: string | null
          years_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_experience_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_experience_work_experience_id_fkey"
            columns: ["work_experience_id"]
            isOneToOne: false
            referencedRelation: "work_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      source_resumes: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          name: string
          parsed_at: string
          raw_content: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          parsed_at?: string
          raw_content?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          parsed_at?: string
          raw_content?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string
          id: string
          proficiency_level: string | null
          skill_name: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency_level?: string | null
          skill_name: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency_level?: string | null
          skill_name?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      work_experiences: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

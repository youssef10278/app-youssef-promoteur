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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      checks: {
        Row: {
          created_at: string
          date_emission: string
          date_encaissement: string | null
          description: string | null
          facture_recue: boolean
          id: string
          montant: number
          nom_beneficiaire: string | null
          nom_emetteur: string | null
          numero_cheque: string | null
          project_id: string | null
          type_cheque: Database["public"]["Enums"]["check_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_emission: string
          date_encaissement?: string | null
          description?: string | null
          facture_recue?: boolean
          id?: string
          montant: number
          nom_beneficiaire?: string | null
          nom_emetteur?: string | null
          numero_cheque?: string | null
          project_id?: string | null
          type_cheque: Database["public"]["Enums"]["check_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_emission?: string
          date_encaissement?: string | null
          description?: string | null
          facture_recue?: boolean
          id?: string
          montant?: number
          nom_beneficiaire?: string | null
          nom_emetteur?: string | null
          numero_cheque?: string | null
          project_id?: string | null
          type_cheque?: Database["public"]["Enums"]["check_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          methode_paiement: Database["public"]["Enums"]["payment_method"]
          montant_declare: number
          montant_non_declare: number
          montant_total: number | null
          nom: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          methode_paiement: Database["public"]["Enums"]["payment_method"]
          montant_declare?: number
          montant_non_declare?: number
          montant_total?: number | null
          nom: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          methode_paiement?: Database["public"]["Enums"]["payment_method"]
          montant_declare?: number
          montant_non_declare?: number
          montant_total?: number | null
          nom?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string
          societe: string | null
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nom: string
          societe?: string | null
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string
          societe?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          localisation: string
          nom: string
          nombre_appartements: number
          nombre_garages: number
          nombre_lots: number
          societe: string
          surface_totale: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          localisation: string
          nom: string
          nombre_appartements?: number
          nombre_garages?: number
          nombre_lots: number
          societe: string
          surface_totale: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          localisation?: string
          nom?: string
          nombre_appartements?: number
          nombre_garages?: number
          nombre_lots?: number
          societe?: string
          surface_totale?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          avance_declare: number
          avance_non_declare: number
          avance_total: number | null
          created_at: string
          description: string
          id: string
          prix_total: number
          project_id: string
          surface: number
          type_propriete: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          avance_declare?: number
          avance_non_declare?: number
          avance_total?: number | null
          created_at?: string
          description: string
          id?: string
          prix_total: number
          project_id: string
          surface: number
          type_propriete: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          avance_declare?: number
          avance_non_declare?: number
          avance_total?: number | null
          created_at?: string
          description?: string
          id?: string
          prix_total?: number
          project_id?: string
          surface?: number
          type_propriete?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      check_type: "recu" | "donne"
      payment_method: "cheque" | "espece" | "cheque_et_espece"
      property_type: "appartement" | "garage"
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
    Enums: {
      check_type: ["recu", "donne"],
      payment_method: ["cheque", "espece", "cheque_et_espece"],
      property_type: ["appartement", "garage"],
    },
  },
} as const

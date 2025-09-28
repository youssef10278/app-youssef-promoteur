export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sales: {
        Row: {
          avance_cheque: number
          avance_declare: number
          avance_espece: number
          avance_non_declare: number
          avance_total: number
          client_adresse: string | null
          client_email: string | null
          client_nom: string
          client_telephone: string | null
          created_at: string
          description: string
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_mode"]
          prix_total: number
          project_id: string
          statut: Database["public"]["Enums"]["sale_status"]
          surface: number
          type_propriete: Database["public"]["Enums"]["property_type"]
          unite_disponible: boolean | null
          unite_numero: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avance_cheque?: number
          avance_declare?: number
          avance_espece?: number
          avance_non_declare?: number
          avance_total?: number
          client_adresse?: string | null
          client_email?: string | null
          client_nom: string
          client_telephone?: string | null
          created_at?: string
          description: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"]
          prix_total: number
          project_id: string
          statut?: Database["public"]["Enums"]["sale_status"]
          surface: number
          type_propriete: Database["public"]["Enums"]["property_type"]
          unite_disponible?: boolean | null
          unite_numero: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avance_cheque?: number
          avance_declare?: number
          avance_espece?: number
          avance_non_declare?: number
          avance_total?: number
          client_adresse?: string | null
          client_email?: string | null
          client_nom?: string
          client_telephone?: string | null
          created_at?: string
          description?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"]
          prix_total?: number
          project_id?: string
          statut?: Database["public"]["Enums"]["sale_status"]
          surface?: number
          type_propriete?: Database["public"]["Enums"]["property_type"]
          unite_disponible?: boolean | null
          unite_numero?: string
          updated_at?: string
          user_id?: string
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
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          localisation: string | null
          nom: string
          nombre_appartements: number | null
          nombre_garages: number | null
          nombre_lots: number | null
          prix_m2: number | null
          societe: string
          surface_totale: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          localisation?: string | null
          nom: string
          nombre_appartements?: number | null
          nombre_garages?: number | null
          nombre_lots?: number | null
          prix_m2?: number | null
          societe: string
          surface_totale?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          localisation?: string | null
          nom?: string
          nombre_appartements?: number | null
          nombre_garages?: number | null
          nombre_lots?: number | null
          prix_m2?: number | null
          societe?: string
          surface_totale?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_mode"]
          montant_cheque: number
          montant_declare: number
          montant_espece: number
          montant_non_declare: number
          montant_total: number
          nom: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"]
          montant_cheque?: number
          montant_declare?: number
          montant_espece?: number
          montant_non_declare?: number
          montant_total?: number
          nom: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"]
          montant_cheque?: number
          montant_declare?: number
          montant_espece?: number
          montant_non_declare?: number
          montant_total?: number
          nom?: string
          project_id?: string
          updated_at?: string
          user_id?: string
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
      checks: {
        Row: {
          created_at: string
          date_emission: string
          date_encaissement: string | null
          description: string | null
          expense_id: string | null
          facture_recue: boolean
          id: string
          montant: number
          nom_beneficiaire: string | null
          nom_emetteur: string | null
          numero_cheque: string | null
          project_id: string | null
          sale_id: string | null
          statut: Database["public"]["Enums"]["check_status"]
          type_cheque: Database["public"]["Enums"]["check_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_emission: string
          date_encaissement?: string | null
          description?: string | null
          expense_id?: string | null
          facture_recue?: boolean
          id?: string
          montant: number
          nom_beneficiaire?: string | null
          nom_emetteur?: string | null
          numero_cheque?: string | null
          project_id?: string | null
          sale_id?: string | null
          statut?: Database["public"]["Enums"]["check_status"]
          type_cheque: Database["public"]["Enums"]["check_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_emission?: string
          date_encaissement?: string | null
          description?: string | null
          expense_id?: string | null
          facture_recue?: boolean
          id?: string
          montant?: number
          nom_beneficiaire?: string | null
          nom_emetteur?: string | null
          numero_cheque?: string | null
          project_id?: string | null
          sale_id?: string | null
          statut?: Database["public"]["Enums"]["check_status"]
          type_cheque?: Database["public"]["Enums"]["check_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          date_paiement: string | null
          date_prevue: string
          description: string | null
          id: string
          mode_paiement: Database["public"]["Enums"]["payment_mode"] | null
          montant_cheque: number | null
          montant_espece: number | null
          montant_paye: number
          montant_prevu: number
          notes: string | null
          numero_echeance: number
          sale_id: string
          statut: Database["public"]["Enums"]["payment_plan_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string | null
          date_prevue: string
          description?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"] | null
          montant_cheque?: number | null
          montant_espece?: number | null
          montant_paye?: number
          montant_prevu: number
          notes?: string | null
          numero_echeance: number
          sale_id: string
          statut?: Database["public"]["Enums"]["payment_plan_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_paiement?: string | null
          date_prevue?: string
          description?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["payment_mode"] | null
          montant_cheque?: number | null
          montant_espece?: number | null
          montant_paye?: number
          montant_prevu?: number
          notes?: string | null
          numero_echeance?: number
          sale_id?: string
          statut?: Database["public"]["Enums"]["payment_plan_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_checks: {
        Row: {
          banque: string | null
          created_at: string
          date_emission: string | null
          date_encaissement: string | null
          id: string
          montant: number
          notes: string | null
          numero_cheque: string
          payment_plan_id: string
          statut: Database["public"]["Enums"]["check_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          banque?: string | null
          created_at?: string
          date_emission?: string | null
          date_encaissement?: string | null
          id?: string
          montant: number
          notes?: string | null
          numero_cheque: string
          payment_plan_id: string
          statut?: Database["public"]["Enums"]["check_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          banque?: string | null
          created_at?: string
          date_emission?: string | null
          date_encaissement?: string | null
          id?: string
          montant?: number
          notes?: string | null
          numero_cheque?: string
          payment_plan_id?: string
          statut?: Database["public"]["Enums"]["check_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_checks_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      check_status: "emis" | "encaisse" | "annule"
      check_type: "recu" | "donne"
      payment_method: "cheque" | "espece" | "cheque_et_espece"
      payment_mode: "espece" | "cheque" | "cheque_espece" | "virement"
      payment_plan_status: "planifie" | "recu" | "en_retard" | "annule"
      payment_status: "recu" | "encaisse" | "rejete"
      property_type:
        | "appartement"
        | "garage"
      sale_status: "en_cours" | "termine" | "annule"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

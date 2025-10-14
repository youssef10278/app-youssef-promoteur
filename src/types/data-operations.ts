// Types pour les opérations d'import/export des données

export type OperationType = 'export' | 'import';

export type DataType = 
  | 'global'
  | 'projects' 
  | 'sales'
  | 'expenses'
  | 'checks'
  | 'payments';

export type OperationStatus = 'pending' | 'completed' | 'failed';

export type DuplicateStrategy = 'ignore' | 'replace' | 'create_new';

export interface DataOperation {
  id: string;
  user_id: string;
  operation_type: OperationType;
  data_type: DataType;
  file_name?: string;
  file_size?: number;
  records_count?: number;
  status: OperationStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportRequest {
  data_type: DataType;
  format: 'json' | 'csv';
  selected_types?: DataType[]; // Pour export sélectif
}

export interface ImportRequest {
  data_type: DataType;
  file: File;
  duplicate_strategy: DuplicateStrategy;
  validate_only?: boolean; // Pour prévisualisation
}

export interface ExportResponse {
  success: boolean;
  operation_id: string;
  download_url?: string;
  file_name: string;
  file_size: number;
  records_count: number;
}

export interface ImportResponse {
  success: boolean;
  operation_id: string;
  records_imported: number;
  records_skipped: number;
  records_failed: number;
  duplicates_found: number;
  errors?: string[];
}

export interface ValidationResponse {
  valid: boolean;
  records_count: number;
  duplicates_found: number;
  errors: string[];
  warnings: string[];
  preview: any[]; // Aperçu des premières lignes
}

// Structure des données exportées (format JSON global)
export interface GlobalExportData {
  export_info: {
    date: string;
    user_id: string;
    version: string;
    total_records: number;
  };
  data: {
    projects: any[];
    sales: any[];
    expenses: any[];
    payment_plans: any[];
    expense_payments: any[];
    checks: any[];
  };
}

// Options d'export
export interface ExportOptions {
  include_deleted?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  project_ids?: string[];
}

// Options d'import
export interface ImportOptions {
  duplicate_strategy: DuplicateStrategy;
  validate_references?: boolean;
  create_missing_projects?: boolean;
  backup_before_import?: boolean;
}

// Statistiques d'opération
export interface OperationStats {
  total_operations: number;
  exports_count: number;
  imports_count: number;
  total_size: number;
  last_export?: string;
  last_import?: string;
}

// Labels pour l'interface
export const DATA_TYPE_LABELS: Record<DataType, string> = {
  global: 'Toutes les données',
  projects: 'Projets',
  sales: 'Ventes',
  expenses: 'Dépenses',
  checks: 'Chèques',
  payments: 'Paiements'
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  export: 'Export',
  import: 'Import'
};

export const STATUS_LABELS: Record<OperationStatus, string> = {
  pending: 'En cours',
  completed: 'Terminé',
  failed: 'Échec'
};

export const DUPLICATE_STRATEGY_LABELS: Record<DuplicateStrategy, string> = {
  ignore: 'Ignorer les doublons',
  replace: 'Remplacer les doublons',
  create_new: 'Créer de nouveaux enregistrements'
};

export type DataType = 'global' | 'projects' | 'sales' | 'expenses' | 'checks' | 'payments';
export type OperationType = 'export' | 'import';
export type OperationStatus = 'pending' | 'completed' | 'failed';
export type DuplicateStrategy = 'ignore' | 'replace' | 'create_new';
export type ExportFormat = 'json' | 'csv';

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
  created_at: Date;
  updated_at: Date;
}

export interface ImportRequest {
  data_type: DataType;
  file_content: string; // Base64 encoded
  file_name: string;
  duplicate_strategy: DuplicateStrategy;
}

export interface ExportRequest {
  data_types: DataType[];
  format: ExportFormat;
  include_metadata?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  records_count: number;
  errors: string[];
  warnings: string[];
  sample_data?: any[];
}

export interface ImportResult {
  success: boolean;
  operation_id: string;
  records_imported: number;
  records_skipped: number;
  records_failed: number;
  errors: string[];
}

export interface ExportResult {
  success: boolean;
  operation_id: string;
  download_url: string;
  records_count: number;
  file_size: number;
}

import { DataType, ValidationResult } from '../types/dataOperations';

export class DataValidationService {
  static validateFileContent(content: string, fileName: string, dataType: DataType): ValidationResult {
    try {
      console.log('🔍 Validation du fichier:', { fileName, dataType, contentLength: content.length });

      // Déterminer le format du fichier
      const isJSON = fileName.toLowerCase().endsWith('.json');
      const isCSV = fileName.toLowerCase().endsWith('.csv');

      if (!isJSON && !isCSV) {
        return {
          valid: false,
          records_count: 0,
          errors: ['Format de fichier non supporté. Utilisez .json ou .csv'],
          warnings: []
        };
      }

      let data: any[];
      
      if (isJSON) {
        data = this.parseJSON(content);
      } else {
        data = this.parseCSV(content);
      }

      // Validation spécifique au type de données
      const validation = this.validateDataType(data, dataType);
      
      console.log('✅ Validation terminée:', {
        valid: validation.valid,
        recordsCount: validation.records_count,
        errorsCount: validation.errors.length
      });

      return validation;

    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      return {
        valid: false,
        records_count: 0,
        errors: [`Erreur de validation: ${error.message}`],
        warnings: []
      };
    }
  }

  private static parseJSON(content: string): any[] {
    try {
      const parsed = JSON.parse(content);
      
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Si c'est un objet, chercher un tableau dans les propriétés
        const arrayKeys = Object.keys(parsed).filter(key => Array.isArray(parsed[key]));
        if (arrayKeys.length === 1) {
          return parsed[arrayKeys[0]];
        }
        throw new Error('Le fichier JSON doit contenir un tableau de données');
      } else {
        throw new Error('Format JSON invalide');
      }
    } catch (error) {
      throw new Error(`Erreur de parsing JSON: ${error.message}`);
    }
  }

  private static parseCSV(content: string): any[] {
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur de parsing CSV: ${error.message}`);
    }
  }

  private static validateDataType(data: any[], dataType: DataType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      return {
        valid: false,
        records_count: 0,
        errors: ['Aucune donnée trouvée dans le fichier'],
        warnings: []
      };
    }

    // Validation spécifique selon le type
    switch (dataType) {
      case 'projects':
        return this.validateProjects(data);
      case 'sales':
        return this.validateSales(data);
      case 'expenses':
        return this.validateExpenses(data);
      case 'checks':
        return this.validateChecks(data);
      case 'payments':
        return this.validatePayments(data);
      case 'global':
        return this.validateGlobalData(data);
      default:
        return {
          valid: false,
          records_count: 0,
          errors: [`Type de données non supporté: ${dataType}`],
          warnings: []
        };
    }
  }

  private static validateProjects(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields = ['nom', 'description'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Ligne ${index + 1}: Champ requis manquant: ${field}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      records_count: data.length,
      errors,
      warnings,
      sample_data: data.slice(0, 3)
    };
  }

  private static validateSales(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields = ['montant', 'date_vente'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Ligne ${index + 1}: Champ requis manquant: ${field}`);
        }
      });

      if (item.montant && isNaN(parseFloat(item.montant))) {
        errors.push(`Ligne ${index + 1}: Montant invalide`);
      }
    });

    return {
      valid: errors.length === 0,
      records_count: data.length,
      errors,
      warnings,
      sample_data: data.slice(0, 3)
    };
  }

  private static validateExpenses(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields = ['nom', 'montant_total'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Ligne ${index + 1}: Champ requis manquant: ${field}`);
        }
      });

      if (item.montant_total && isNaN(parseFloat(item.montant_total))) {
        errors.push(`Ligne ${index + 1}: Montant total invalide`);
      }
    });

    return {
      valid: errors.length === 0,
      records_count: data.length,
      errors,
      warnings,
      sample_data: data.slice(0, 3)
    };
  }

  private static validateChecks(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields = ['numero_cheque', 'montant'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Ligne ${index + 1}: Champ requis manquant: ${field}`);
        }
      });

      if (item.montant && isNaN(parseFloat(item.montant))) {
        errors.push(`Ligne ${index + 1}: Montant invalide`);
      }
    });

    return {
      valid: errors.length === 0,
      records_count: data.length,
      errors,
      warnings,
      sample_data: data.slice(0, 3)
    };
  }

  private static validatePayments(data: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields = ['montant_paye', 'date_paiement'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Ligne ${index + 1}: Champ requis manquant: ${field}`);
        }
      });

      if (item.montant_paye && isNaN(parseFloat(item.montant_paye))) {
        errors.push(`Ligne ${index + 1}: Montant payé invalide`);
      }
    });

    return {
      valid: errors.length === 0,
      records_count: data.length,
      errors,
      warnings,
      sample_data: data.slice(0, 3)
    };
  }

  private static validateGlobalData(data: any[]): ValidationResult {
    // Pour les données globales, validation plus flexible
    return {
      valid: true,
      records_count: data.length,
      errors: [],
      warnings: data.length > 1000 ? ['Fichier volumineux, l\'import peut prendre du temps'] : [],
      sample_data: data.slice(0, 3)
    };
  }
}

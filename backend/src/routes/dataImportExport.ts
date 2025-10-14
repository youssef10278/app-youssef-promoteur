import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Export global de toutes les données
router.get('/export-all', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  
  console.log('📤 Export global demandé pour userId:', userId);

  try {
    // Récupérer toutes les données de l'utilisateur
    const [projects, sales, expenses, checks, payments] = await Promise.all([
      query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM sales WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM expense_payments WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    ]);

    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        user_id: userId,
        total_records: projects.rows.length + sales.rows.length + expenses.rows.length + checks.rows.length + payments.rows.length
      },
      projects: projects.rows,
      sales: sales.rows,
      expenses: expenses.rows,
      checks: checks.rows,
      payments: payments.rows
    };

    console.log('✅ Export terminé:', {
      projects: projects.rows.length,
      sales: sales.rows.length,
      expenses: expenses.rows.length,
      checks: checks.rows.length,
      payments: payments.rows.length
    });

    // Définir les headers pour le téléchargement
    const fileName = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json(exportData);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: `Erreur lors de l'export: ${(error as Error).message}`
    });
  }
}));

// Export par type de données
router.get('/export/:dataType', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { dataType } = req.params;
  
  console.log('📤 Export spécifique demandé:', { userId, dataType });

  let tableName!: string;
  let fileName!: string;

  switch (dataType) {
    case 'projects':
      tableName = 'projects';
      fileName = 'projets';
      break;
    case 'sales':
      tableName = 'sales';
      fileName = 'ventes';
      break;
    case 'expenses':
      tableName = 'expenses';
      fileName = 'depenses';
      break;
    case 'checks':
      tableName = 'checks';
      fileName = 'cheques';
      break;
    case 'payments':
      tableName = 'expense_payments';
      fileName = 'paiements';
      break;
    default:
      res.status(400).json({
        success: false,
        message: 'Type de données non supporté'
      });
      return;
  }

  try {
    const result = await query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        user_id: userId,
        data_type: dataType,
        total_records: result.rows.length
      },
      data: result.rows
    };

    console.log(`✅ Export ${dataType} terminé:`, result.rows.length, 'enregistrements');

    // Définir les headers pour le téléchargement
    const fileNameWithDate = `export-${fileName}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameWithDate}"`);
    
    res.json(exportData);
  } catch (error) {
    console.error(`❌ Erreur lors de l'export ${dataType}:`, error);
    res.status(500).json({
      success: false,
      message: `Erreur lors de l'export ${dataType}: ${(error as Error).message}`
    });
  }
}));

// Import de données
router.post('/import', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { data, dataType, strategy = 'ignore' } = req.body;

  console.log('📥 Import demandé:', { userId, dataType, strategy, recordsCount: data?.length });

  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides ou vides'
    });
  }

  if (!dataType || !['projects', 'sales', 'expenses', 'checks', 'payments'].includes(dataType)) {
    return res.status(400).json({
      success: false,
      message: 'Type de données non supporté'
    });
  }

  let tableName!: string;
  let requiredFields!: string[];

  switch (dataType) {
    case 'projects':
      tableName = 'projects';
      requiredFields = ['name'];
      break;
    case 'sales':
      tableName = 'sales';
      requiredFields = ['amount', 'project_id'];
      break;
    case 'expenses':
      tableName = 'expenses';
      requiredFields = ['name', 'amount'];
      break;
    case 'checks':
      tableName = 'checks';
      requiredFields = ['number', 'amount'];
      break;
    case 'payments':
      tableName = 'expense_payments';
      requiredFields = ['expense_id', 'amount'];
      break;
    default:
      res.status(400).json({
        success: false,
        message: 'Type de données non supporté'
      });
      return;
  }

  try {
    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const record of data) {
      try {
        // Vérifier les champs requis
        const missingFields = requiredFields.filter(field => !record[field]);
        if (missingFields.length > 0) {
          errors.push(`Enregistrement ignoré: champs manquants ${missingFields.join(', ')}`);
          skipped++;
          continue;
        }

        // Préparer les données avec user_id et id
        const recordData = {
          ...record,
          id: record.id || uuidv4(),
          user_id: userId,
          created_at: record.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Vérifier si l'enregistrement existe déjà
        const existingRecord = await query(
          `SELECT id FROM ${tableName} WHERE id = $1 AND user_id = $2`,
          [recordData.id, userId]
        );

        if (existingRecord.rows.length > 0) {
          if (strategy === 'ignore') {
            skipped++;
            continue;
          } else if (strategy === 'replace') {
            // Supprimer l'ancien enregistrement
            await query(
              `DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2`,
              [recordData.id, userId]
            );
          } else if (strategy === 'create_new') {
            // Créer un nouvel ID
            recordData.id = uuidv4();
          }
        }

        // Construire la requête d'insertion dynamiquement
        const fields = Object.keys(recordData);
        const values = Object.values(recordData);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

        const insertQuery = `
          INSERT INTO ${tableName} (${fields.join(', ')})
          VALUES (${placeholders})
        `;

        await query(insertQuery, values);
        imported++;

      } catch (recordError) {
        console.error(`❌ Erreur import enregistrement:`, recordError);
        errors.push(`Erreur: ${(recordError as Error).message}`);
        skipped++;
      }
    }

    console.log('✅ Import terminé:', { imported, skipped, errors: errors.length });

    res.json({
      success: true,
      data: {
        imported,
        skipped,
        total: data.length,
        errors: errors.slice(0, 10) // Limiter les erreurs affichées
      },
      message: `Import terminé: ${imported} importés, ${skipped} ignorés`
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    res.status(500).json({
      success: false,
      message: `Erreur lors de l'import: ${(error as Error).message}`
    });
  }
}));

export default router;

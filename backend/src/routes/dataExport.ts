import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

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

  let tableName: string;
  let fileName: string;

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

export default router;

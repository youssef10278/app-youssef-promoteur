import express from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Route temporaire pour corriger et appliquer la migration (À SUPPRIMER APRÈS UTILISATION)
router.post('/fix-and-apply-expense-payment-migration', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Correction et application de la migration des paiements de dépenses...');

    // 1. Supprimer la table existante si elle existe (pour la recréer proprement)
    await query(`DROP TABLE IF EXISTS expense_payment_plans CASCADE`);
    console.log('✅ Table expense_payment_plans supprimée si elle existait');

    // 2. Créer la table expense_payment_plans avec la bonne fonction UUID
    await query(`
      CREATE TABLE expense_payment_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        numero_echeance INTEGER NOT NULL,
        date_prevue DATE NOT NULL,
        montant_prevu DECIMAL NOT NULL CHECK (montant_prevu > 0),
        montant_paye DECIMAL DEFAULT 0 CHECK (montant_paye >= 0),
        montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
        montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0),
        date_paiement TIMESTAMP,
        mode_paiement TEXT,
        montant_espece DECIMAL DEFAULT 0 CHECK (montant_espece >= 0),
        montant_cheque DECIMAL DEFAULT 0 CHECK (montant_cheque >= 0),
        statut TEXT DEFAULT 'en_attente',
        description TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Contraintes
        CONSTRAINT expense_payment_plans_montant_coherence 
          CHECK (montant_paye = montant_declare + montant_non_declare),
        
        CONSTRAINT expense_payment_plans_mode_coherence 
          CHECK (
            (mode_paiement = 'espece' AND montant_espece > 0 AND montant_cheque = 0) OR
            (mode_paiement = 'cheque' AND montant_cheque > 0 AND montant_espece = 0) OR
            (mode_paiement = 'cheque_espece' AND montant_cheque > 0 AND montant_espece > 0) OR
            (mode_paiement = 'virement' AND montant_cheque = 0 AND montant_espece = 0) OR
            (mode_paiement IS NULL)
          ),
        
        CONSTRAINT expense_payment_plans_montant_mode_coherence 
          CHECK (montant_espece + montant_cheque = montant_paye),
        
        UNIQUE(expense_id, numero_echeance)
      )
    `);
    console.log('✅ Table expense_payment_plans créée avec succès');

    // 3. Ajouter les colonnes à la table expenses
    await query(`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'non_paye'
    `);

    await query(`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL DEFAULT 0
    `);

    await query(`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS montant_restant DECIMAL DEFAULT 0
    `);
    console.log('✅ Colonnes ajoutées à la table expenses');

    // 4. Créer la fonction de mise à jour automatique
    await query(`
      CREATE OR REPLACE FUNCTION update_expense_payment_status()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Calculer les totaux pour cette dépense
        UPDATE expenses 
        SET 
          montant_total_paye = COALESCE((
            SELECT SUM(montant_paye) 
            FROM expense_payment_plans 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
          ), 0),
          montant_restant = montant_total - COALESCE((
            SELECT SUM(montant_paye) 
            FROM expense_payment_plans 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
          ), 0)
        WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
        
        -- Mettre à jour le statut de paiement
        UPDATE expenses 
        SET statut_paiement = CASE 
          WHEN montant_total_paye = 0 THEN 'non_paye'
          WHEN montant_total_paye >= montant_total THEN 'paye'
          ELSE 'partiellement_paye'
        END
        WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Fonction update_expense_payment_status créée');

    // 5. Créer les triggers
    await query(`DROP TRIGGER IF EXISTS expense_payment_plans_update_status ON expense_payment_plans`);
    await query(`
      CREATE TRIGGER expense_payment_plans_update_status
        AFTER INSERT OR UPDATE OR DELETE ON expense_payment_plans
        FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status()
    `);
    console.log('✅ Triggers créés');

    // 6. Mettre à jour les dépenses existantes
    await query(`
      UPDATE expenses 
      SET 
        statut_paiement = 'non_paye',
        montant_total_paye = 0,
        montant_restant = montant_total
      WHERE statut_paiement IS NULL
    `);
    console.log('✅ Dépenses existantes mises à jour');

    // 7. Créer les index pour les performances
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_user_id ON expense_payment_plans(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_statut ON expense_payment_plans(statut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expenses_statut_paiement ON expenses(statut_paiement)`);
    console.log('✅ Index créés pour les performances');

    // Vérification finale
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_payment_plans'
    `);

    console.log('🎉 Migration des paiements de dépenses corrigée et appliquée avec succès !');

    res.json({
      success: true,
      message: 'Migration des paiements de dépenses corrigée et appliquée avec succès !',
      tableCreated: tableCheck.rows.length > 0,
      details: {
        tableDropped: true,
        tableRecreated: true,
        columnsAdded: true,
        functionsCreated: true,
        triggersCreated: true,
        indexesCreated: true,
        existingDataUpdated: true
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la correction et application de la migration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction et application de la migration',
      error: error.message
    });
  }
});

// Route temporaire pour appliquer la migration (ANCIENNE VERSION - REDIRIGE VERS LA NOUVELLE)
router.post('/apply-expense-payment-migration', authenticateToken, async (req, res) => {
  console.log('🔄 Redirection vers la nouvelle route de migration corrigée...');

  res.json({
    success: false,
    message: 'Cette route est obsolète. Utilisez /api/migrate/fix-and-apply-expense-payment-migration',
    redirect: '/api/migrate/fix-and-apply-expense-payment-migration'
  });
});

export default router;

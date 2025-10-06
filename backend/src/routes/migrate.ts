import express from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Route temporaire pour appliquer la migration (À SUPPRIMER APRÈS UTILISATION)
router.post('/apply-expense-payment-migration', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Application de la migration des paiements de dépenses...');

    // 1. Créer la table expense_payment_plans
    await query(`
      CREATE TABLE IF NOT EXISTS expense_payment_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        numero_echeance INTEGER NOT NULL,
        date_prevue DATE NOT NULL,
        montant_prevu DECIMAL NOT NULL CHECK (montant_prevu > 0),
        montant_paye DECIMAL DEFAULT 0 CHECK (montant_paye >= 0),
        montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
        montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0),
        date_paiement TIMESTAMP WITH TIME ZONE,
        mode_paiement payment_mode,
        montant_espece DECIMAL DEFAULT 0 CHECK (montant_espece >= 0),
        montant_cheque DECIMAL DEFAULT 0 CHECK (montant_cheque >= 0),
        statut payment_plan_status DEFAULT 'en_attente',
        description TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
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

    // 2. Ajouter les colonnes à la table expenses
    await query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(20) DEFAULT 'non_paye' 
      CHECK (statut_paiement IN ('non_paye', 'partiellement_paye', 'paye'))
    `);

    await query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL DEFAULT 0 CHECK (montant_total_paye >= 0)
    `);

    await query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS montant_restant DECIMAL DEFAULT 0 CHECK (montant_restant >= 0)
    `);

    // 3. Créer la fonction de mise à jour automatique
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

    // 4. Créer les triggers
    await query(`DROP TRIGGER IF EXISTS expense_payment_plans_update_status ON expense_payment_plans`);
    await query(`
      CREATE TRIGGER expense_payment_plans_update_status
        AFTER INSERT OR UPDATE OR DELETE ON expense_payment_plans
        FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status()
    `);

    // 5. Mettre à jour les dépenses existantes
    await query(`
      UPDATE expenses 
      SET 
        statut_paiement = 'non_paye',
        montant_total_paye = 0,
        montant_restant = montant_total
      WHERE statut_paiement IS NULL
    `);

    // 6. Créer les index pour les performances
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_user_id ON expense_payment_plans(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_statut ON expense_payment_plans(statut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expenses_statut_paiement ON expenses(statut_paiement)`);

    // Vérification finale
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_payment_plans'
    `);

    console.log('✅ Migration des paiements de dépenses appliquée avec succès !');

    res.json({
      success: true,
      message: 'Migration des paiements de dépenses appliquée avec succès !',
      tableCreated: tableCheck.rows.length > 0
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'application de la migration',
      error: error.message
    });
  }
});

export default router;

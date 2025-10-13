-- Migration pour refactoriser le système de dépenses
-- Permet la création de dépenses sans montant initial et l'ajout progressif de paiements

-- 1. Ajouter un statut aux dépenses existantes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'statut'
  ) THEN
    ALTER TABLE expenses 
    ADD COLUMN statut VARCHAR(20) DEFAULT 'actif' 
    CHECK (statut IN ('actif', 'termine', 'annule'));
    
    COMMENT ON COLUMN expenses.statut IS 'Statut de la dépense: actif, termine, annule';
  END IF;
END $$;

-- 2. Rendre les montants optionnels dans la table expenses
-- Les montants seront maintenant calculés à partir des paiements individuels
DO $$
BEGIN
  -- Supprimer la contrainte de génération automatique du montant_total si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'montant_total' 
    AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE expenses ALTER COLUMN montant_total DROP EXPRESSION;
  END IF;
  
  -- Rendre les montants optionnels avec valeur par défaut 0
  ALTER TABLE expenses 
    ALTER COLUMN montant_declare SET DEFAULT 0,
    ALTER COLUMN montant_non_declare SET DEFAULT 0,
    ALTER COLUMN montant_total SET DEFAULT 0;
END $$;

-- 3. Créer la table expense_payments pour les paiements individuels
CREATE TABLE IF NOT EXISTS expense_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informations du paiement
  montant_paye DECIMAL NOT NULL CHECK (montant_paye > 0),
  montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
  montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0),
  
  -- Détails du paiement
  date_paiement DATE NOT NULL,
  mode_paiement payment_mode NOT NULL,
  description TEXT,
  reference_paiement VARCHAR(100), -- Numéro chèque, référence virement, etc.
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte : montant_paye = montant_declare + montant_non_declare
  CONSTRAINT check_montant_coherence 
    CHECK (montant_paye = montant_declare + montant_non_declare)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id ON expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_user_id ON expense_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_date ON expense_payments(date_paiement);

-- Commentaires pour la documentation
COMMENT ON TABLE expense_payments IS 'Paiements individuels pour chaque dépense';
COMMENT ON COLUMN expense_payments.montant_paye IS 'Montant total du paiement';
COMMENT ON COLUMN expense_payments.montant_declare IS 'Partie déclarée du paiement';
COMMENT ON COLUMN expense_payments.montant_non_declare IS 'Partie non déclarée du paiement';
COMMENT ON COLUMN expense_payments.reference_paiement IS 'Référence du paiement (numéro chèque, virement, etc.)';

-- 4. Créer une vue pour calculer automatiquement les totaux des dépenses
CREATE OR REPLACE VIEW expenses_with_totals AS
SELECT 
  e.*,
  COALESCE(ep.total_paye, 0) as total_paye_calcule,
  COALESCE(ep.total_declare, 0) as total_declare_calcule,
  COALESCE(ep.total_non_declare, 0) as total_non_declare_calcule,
  COALESCE(ep.nombre_paiements, 0) as nombre_paiements
FROM expenses e
LEFT JOIN (
  SELECT 
    expense_id,
    SUM(montant_paye) as total_paye,
    SUM(montant_declare) as total_declare,
    SUM(montant_non_declare) as total_non_declare,
    COUNT(*) as nombre_paiements
  FROM expense_payments
  GROUP BY expense_id
) ep ON e.id = ep.expense_id;

-- 5. Fonction pour migrer les données existantes
CREATE OR REPLACE FUNCTION migrate_existing_expenses()
RETURNS void AS $$
DECLARE
  expense_record RECORD;
BEGIN
  -- Pour chaque dépense existante avec un montant > 0, créer un paiement initial
  FOR expense_record IN 
    SELECT id, user_id, montant_total, montant_declare, montant_non_declare, 
           methode_paiement, created_at
    FROM expenses 
    WHERE montant_total > 0 
    AND NOT EXISTS (
      SELECT 1 FROM expense_payments WHERE expense_id = expenses.id
    )
  LOOP
    INSERT INTO expense_payments (
      expense_id, user_id, montant_paye, montant_declare, 
      montant_non_declare, date_paiement, mode_paiement, 
      description, created_at
    ) VALUES (
      expense_record.id,
      expense_record.user_id,
      expense_record.montant_total,
      expense_record.montant_declare,
      expense_record.montant_non_declare,
      expense_record.created_at::date,
      expense_record.methode_paiement,
      'Paiement initial (migration automatique)',
      expense_record.created_at
    );
  END LOOP;
  
  RAISE NOTICE 'Migration des dépenses existantes terminée';
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour mettre à jour les totaux des dépenses
CREATE OR REPLACE FUNCTION update_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les totaux de la dépense concernée
  UPDATE expenses 
  SET 
    montant_total = (
      SELECT COALESCE(SUM(montant_paye), 0) 
      FROM expense_payments 
      WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    montant_declare = (
      SELECT COALESCE(SUM(montant_declare), 0) 
      FROM expense_payments 
      WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    montant_non_declare = (
      SELECT COALESCE(SUM(montant_non_declare), 0) 
      FROM expense_payments 
      WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Créer les triggers pour maintenir la cohérence
DROP TRIGGER IF EXISTS trigger_update_expense_totals ON expense_payments;
CREATE TRIGGER trigger_update_expense_totals
  AFTER INSERT OR UPDATE OR DELETE ON expense_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_totals();

-- 8. Exécuter la migration des données existantes
SELECT migrate_existing_expenses();

-- 9. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration du système de dépenses terminée avec succès !';
  RAISE NOTICE '📊 Nouvelles fonctionnalités disponibles :';
  RAISE NOTICE '   - Création de dépenses sans montant initial';
  RAISE NOTICE '   - Ajout progressif de paiements';
  RAISE NOTICE '   - Calcul automatique des totaux';
  RAISE NOTICE '   - Historique complet des paiements';
END $$;

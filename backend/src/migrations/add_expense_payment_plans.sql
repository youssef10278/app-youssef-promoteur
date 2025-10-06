-- Migration pour ajouter le système de paiements par tranches aux dépenses
-- Similaire au système des ventes mais pour les dépenses

-- Créer la table expense_payment_plans (plans de paiement pour dépenses)
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
      (mode_paiement = 'espece' AND montant_cheque = 0 AND montant_espece = montant_paye) OR
      (mode_paiement = 'cheque' AND montant_espece = 0 AND montant_cheque = montant_paye) OR
      (mode_paiement = 'cheque_espece' AND montant_cheque + montant_espece = montant_paye) OR
      (mode_paiement = 'virement' AND montant_cheque = 0 AND montant_espece = 0)
    )
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_user_id ON expense_payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_date_prevue ON expense_payment_plans(date_prevue);
CREATE INDEX IF NOT EXISTS idx_expense_payment_plans_statut ON expense_payment_plans(statut);

-- Contrainte d'unicité pour éviter les doublons d'échéances
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_payment_plans_unique_echeance 
ON expense_payment_plans(expense_id, numero_echeance);

-- Ajouter un champ statut_paiement à la table expenses pour tracker l'état global
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'non_paye' 
CHECK (statut_paiement IN ('non_paye', 'partiellement_paye', 'paye'));

-- Ajouter des champs pour tracker les totaux payés
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL DEFAULT 0 CHECK (montant_total_paye >= 0),
ADD COLUMN IF NOT EXISTS montant_restant DECIMAL GENERATED ALWAYS AS (montant_total - montant_total_paye) STORED;

-- Fonction pour mettre à jour automatiquement le statut de paiement de la dépense
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  expense_total DECIMAL;
  total_paye DECIMAL;
  expense_id_val UUID;
BEGIN
  -- Récupérer l'expense_id selon le type d'opération
  IF TG_OP = 'DELETE' THEN
    expense_id_val := OLD.expense_id;
  ELSE
    expense_id_val := NEW.expense_id;
  END IF;

  -- Calculer le total payé pour cette dépense
  SELECT COALESCE(SUM(montant_paye), 0) INTO total_paye
  FROM expense_payment_plans 
  WHERE expense_id = expense_id_val;

  -- Récupérer le montant total de la dépense
  SELECT montant_total INTO expense_total
  FROM expenses 
  WHERE id = expense_id_val;

  -- Mettre à jour le statut et les montants
  UPDATE expenses 
  SET 
    montant_total_paye = total_paye,
    statut_paiement = CASE 
      WHEN total_paye = 0 THEN 'non_paye'
      WHEN total_paye >= expense_total THEN 'paye'
      ELSE 'partiellement_paye'
    END
  WHERE id = expense_id_val;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour mettre à jour automatiquement le statut
DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_insert ON expense_payment_plans;
CREATE TRIGGER trigger_update_expense_payment_status_insert
  AFTER INSERT ON expense_payment_plans
  FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_update ON expense_payment_plans;
CREATE TRIGGER trigger_update_expense_payment_status_update
  AFTER UPDATE ON expense_payment_plans
  FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_delete ON expense_payment_plans;
CREATE TRIGGER trigger_update_expense_payment_status_delete
  AFTER DELETE ON expense_payment_plans
  FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

-- Commentaires pour documentation
COMMENT ON TABLE expense_payment_plans IS 'Plans de paiement par tranches pour les dépenses';
COMMENT ON COLUMN expense_payment_plans.numero_echeance IS 'Numéro de l''échéance (1, 2, 3, ...)';
COMMENT ON COLUMN expense_payment_plans.montant_prevu IS 'Montant prévu pour cette échéance';
COMMENT ON COLUMN expense_payment_plans.montant_paye IS 'Montant effectivement payé';
COMMENT ON COLUMN expense_payment_plans.statut IS 'Statut du paiement: en_attente, paye, en_retard, annule';

COMMENT ON COLUMN expenses.statut_paiement IS 'Statut global de paiement: non_paye, partiellement_paye, paye';
COMMENT ON COLUMN expenses.montant_total_paye IS 'Montant total payé sur toutes les tranches';
COMMENT ON COLUMN expenses.montant_restant IS 'Montant restant à payer (calculé automatiquement)';

-- 🚨 FIX DIRECT BASE DE DONNÉES - NOUVELLE MÉTHODE
-- Exécuter ce script directement dans Railway PostgreSQL

-- ÉTAPE 1: Supprimer complètement la table défectueuse
DROP TABLE IF EXISTS expense_payment_plans CASCADE;

-- ÉTAPE 2: Recréer la table avec la configuration correcte
CREATE TABLE expense_payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    numero_echeance INTEGER NOT NULL,
    date_prevue DATE NOT NULL,
    montant_prevu DECIMAL(10,2) NOT NULL CHECK (montant_prevu > 0),
    montant_paye DECIMAL(10,2) DEFAULT 0 CHECK (montant_paye >= 0),
    montant_declare DECIMAL(10,2) DEFAULT 0 CHECK (montant_declare >= 0),
    montant_non_declare DECIMAL(10,2) DEFAULT 0 CHECK (montant_non_declare >= 0),
    date_paiement TIMESTAMP,
    mode_paiement TEXT CHECK (mode_paiement IN ('espece', 'cheque', 'cheque_espece', 'virement')),
    montant_espece DECIMAL(10,2) DEFAULT 0 CHECK (montant_espece >= 0),
    montant_cheque DECIMAL(10,2) DEFAULT 0 CHECK (montant_cheque >= 0),
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'en_retard', 'annule')),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÉTAPE 3: Ajouter les contraintes de clés étrangères
ALTER TABLE expense_payment_plans 
ADD CONSTRAINT fk_expense_payment_plans_expense 
FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE;

ALTER TABLE expense_payment_plans 
ADD CONSTRAINT fk_expense_payment_plans_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ÉTAPE 4: Créer les index pour les performances
CREATE INDEX idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id);
CREATE INDEX idx_expense_payment_plans_user_id ON expense_payment_plans(user_id);
CREATE INDEX idx_expense_payment_plans_statut ON expense_payment_plans(statut);
CREATE INDEX idx_expense_payment_plans_date_prevue ON expense_payment_plans(date_prevue);

-- ÉTAPE 5: Ajouter les colonnes manquantes à la table expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'non_paye';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL(10,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_restant DECIMAL(10,2) DEFAULT 0;

-- ÉTAPE 6: Créer une fonction pour mettre à jour automatiquement le statut des dépenses
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer le montant total payé pour cette dépense
    UPDATE expenses 
    SET 
        montant_total_paye = (
            SELECT COALESCE(SUM(montant_paye), 0) 
            FROM expense_payment_plans 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
        ),
        montant_restant = montant_total - (
            SELECT COALESCE(SUM(montant_paye), 0) 
            FROM expense_payment_plans 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
        ),
        statut_paiement = CASE 
            WHEN (
                SELECT COALESCE(SUM(montant_paye), 0) 
                FROM expense_payment_plans 
                WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
            ) = 0 THEN 'non_paye'
            WHEN (
                SELECT COALESCE(SUM(montant_paye), 0) 
                FROM expense_payment_plans 
                WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
            ) >= montant_total THEN 'paye'
            ELSE 'partiellement_paye'
        END
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 7: Créer les triggers pour mise à jour automatique
DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_insert ON expense_payment_plans;
DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_update ON expense_payment_plans;
DROP TRIGGER IF EXISTS trigger_update_expense_payment_status_delete ON expense_payment_plans;

CREATE TRIGGER trigger_update_expense_payment_status_insert
    AFTER INSERT ON expense_payment_plans
    FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

CREATE TRIGGER trigger_update_expense_payment_status_update
    AFTER UPDATE ON expense_payment_plans
    FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

CREATE TRIGGER trigger_update_expense_payment_status_delete
    AFTER DELETE ON expense_payment_plans
    FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

-- ÉTAPE 8: Test d'insertion pour vérifier que tout fonctionne
-- (Remplacez les UUID par des vrais ID de votre base)
-- INSERT INTO expense_payment_plans (expense_id, user_id, numero_echeance, date_prevue, montant_prevu) 
-- VALUES (
--     (SELECT id FROM expenses LIMIT 1), 
--     (SELECT id FROM users LIMIT 1), 
--     1, 
--     CURRENT_DATE, 
--     1000.00
-- );

-- Vérifier que l'ID est bien généré automatiquement
-- SELECT id, expense_id, user_id, numero_echeance, montant_prevu FROM expense_payment_plans WHERE numero_echeance = 1;

-- Supprimer le test
-- DELETE FROM expense_payment_plans WHERE numero_echeance = 1;

-- ÉTAPE 9: Vérification finale
SELECT 
    'expense_payment_plans' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expense_payment_plans' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'expense_payment_plans';

-- Message de succès
SELECT 'FIX TERMINÉ - Table expense_payment_plans recréée avec succès !' as status;

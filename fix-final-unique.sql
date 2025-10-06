-- 🚨 MÉTHODE UNIQUE - FIX DÉFINITIF
-- Copiez et collez ce script dans Railway PostgreSQL Query

-- Supprimer la table défectueuse
DROP TABLE IF EXISTS expense_payment_plans CASCADE;

-- Recréer la table correctement
CREATE TABLE expense_payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    numero_echeance INTEGER NOT NULL,
    date_prevue DATE NOT NULL,
    montant_prevu DECIMAL NOT NULL,
    montant_paye DECIMAL DEFAULT 0,
    montant_declare DECIMAL DEFAULT 0,
    montant_non_declare DECIMAL DEFAULT 0,
    date_paiement TIMESTAMP,
    mode_paiement TEXT,
    montant_espece DECIMAL DEFAULT 0,
    montant_cheque DECIMAL DEFAULT 0,
    statut TEXT DEFAULT 'en_attente',
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter les colonnes manquantes à expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'non_paye';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_restant DECIMAL DEFAULT 0;

-- Créer les index
CREATE INDEX idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id);
CREATE INDEX idx_expense_payment_plans_user_id ON expense_payment_plans(user_id);

-- Test final
SELECT 'FIX TERMINÉ - Testez maintenant votre application !' as resultat;

-- ========================================
-- MIGRATION RAILWAY - SYSTÈME DÉPENSES PROGRESSIVES
-- ========================================
-- À exécuter dans pgAdmin 4 connecté à Railway

-- 1. Ajouter la colonne statut si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'statut'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN statut VARCHAR(20) DEFAULT 'actif' 
        CHECK (statut IN ('actif', 'termine', 'annule'));
        
        RAISE NOTICE 'Colonne statut ajoutée à la table expenses';
    ELSE
        RAISE NOTICE 'Colonne statut existe déjà';
    END IF;
END $$;

-- 2. Créer la table expense_payments si elle n'existe pas
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
    mode_paiement VARCHAR(20) NOT NULL CHECK (mode_paiement IN ('espece', 'cheque', 'cheque_espece', 'virement')),
    description TEXT,
    reference_paiement VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte : montant_paye = montant_declare + montant_non_declare
    CONSTRAINT check_montant_coherence 
      CHECK (montant_paye = montant_declare + montant_non_declare)
);

-- 3. Créer les index pour expense_payments
CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id ON expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_user_id ON expense_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_date ON expense_payments(date_paiement);

-- 4. Créer la vue expenses_with_totals
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

-- 5. Créer la fonction de trigger
CREATE OR REPLACE FUNCTION update_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour seulement updated_at car montant_total est une colonne générée
    UPDATE expenses 
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_expense_totals ON expense_payments;
CREATE TRIGGER trigger_update_expense_totals
    AFTER INSERT OR UPDATE OR DELETE ON expense_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_totals();

-- 7. Migrer les données existantes
-- Insérer les paiements pour les dépenses existantes qui n'en ont pas
INSERT INTO expense_payments (
    expense_id, user_id, montant_paye, montant_declare, 
    montant_non_declare, date_paiement, mode_paiement, 
    description, created_at
)
SELECT 
    e.id,
    e.user_id,
    e.montant_total,
    COALESCE(e.montant_declare, 0),
    COALESCE(e.montant_non_declare, 0),
    e.created_at::date,
    CASE 
        WHEN e.methode_paiement = 'cheque_et_espece' THEN 'cheque_espece'
        WHEN e.methode_paiement IS NULL THEN 'espece'
        ELSE e.methode_paiement::text
    END,
    'Paiement initial (migration automatique)',
    e.created_at
FROM expenses e
WHERE e.montant_total > 0 
AND NOT EXISTS (
    SELECT 1 FROM expense_payments WHERE expense_id = e.id
);

-- 8. Vérification finale
DO $$
DECLARE
    expense_count INTEGER;
    payment_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Compter les dépenses
    SELECT COUNT(*) INTO expense_count FROM expenses;
    
    -- Compter les paiements
    SELECT COUNT(*) INTO payment_count FROM expense_payments;
    
    -- Tester la vue
    SELECT COUNT(*) INTO view_count FROM expenses_with_totals;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dépenses totales: %', expense_count;
    RAISE NOTICE 'Paiements créés: %', payment_count;
    RAISE NOTICE 'Vue accessible: % dépenses', view_count;
    RAISE NOTICE '✅ Système de dépenses progressives opérationnel';
END $$;

-- 9. Test de la vue
SELECT
    'Test de la vue expenses_with_totals' as test,
    COUNT(*) as nombre_depenses,
    SUM(total_paye_calcule) as total_paye,
    SUM(nombre_paiements) as total_paiements
FROM expenses_with_totals;

-- =====================================================
-- Migration: Support Paiements Chèque + Espèces
-- Date: 2025-01-13
-- Description: Ajouter montant_especes pour mode cheque_espece
-- =====================================================

-- 10. Ajouter la colonne montant_especes si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_payments' AND column_name = 'montant_especes'
    ) THEN
        ALTER TABLE expense_payments
        ADD COLUMN montant_especes DECIMAL(10,2) DEFAULT 0;

        -- Mettre à jour les paiements existants
        UPDATE expense_payments
        SET montant_especes = 0
        WHERE montant_especes IS NULL;

        -- Ajouter contrainte pour cohérence
        ALTER TABLE expense_payments
        ADD CONSTRAINT check_montant_especes_positive
        CHECK (montant_especes >= 0);

        RAISE NOTICE 'Colonne montant_especes ajoutée à expense_payments';
    ELSE
        RAISE NOTICE 'Colonne montant_especes existe déjà';
    END IF;
END $$;

-- =====================================================
-- Migration: Import/Export des Données
-- Date: 2025-01-13
-- Description: Table pour historique des opérations import/export
-- =====================================================

-- 11. Créer la table data_operations
CREATE TABLE IF NOT EXISTS data_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN ('export', 'import')),
    data_type VARCHAR(20) NOT NULL, -- 'global', 'projects', 'sales', 'expenses', 'checks', 'payments'
    file_name VARCHAR(255),
    file_size BIGINT,
    records_count INTEGER,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_data_operations_user_id ON data_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_data_operations_created_at ON data_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_operations_type ON data_operations(operation_type, data_type);

-- 13. Vérification finale des nouvelles tables
DO $$
DECLARE
    operations_table_exists BOOLEAN;
    montant_especes_exists BOOLEAN;
BEGIN
    -- Vérifier table data_operations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'data_operations'
    ) INTO operations_table_exists;

    -- Vérifier colonne montant_especes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_payments' AND column_name = 'montant_especes'
    ) INTO montant_especes_exists;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'NOUVELLES MIGRATIONS TERMINÉES !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Table data_operations: %', CASE WHEN operations_table_exists THEN '✅ Créée' ELSE '❌ Échec' END;
    RAISE NOTICE 'Colonne montant_especes: %', CASE WHEN montant_especes_exists THEN '✅ Ajoutée' ELSE '❌ Échec' END;
    RAISE NOTICE 'Système Import/Export prêt !';
END $$;

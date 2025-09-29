-- ============================================================================
-- MIGRATION: Ajout des colonnes montant_declare et montant_non_declare
-- ============================================================================
-- Date: 2025-01-20
-- Description: Ajoute les colonnes pour gérer les montants déclarés et non 
--              déclarés dans la table payment_plans
-- ============================================================================

-- Étape 1: Ajouter les colonnes montant_declare et montant_non_declare
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
ADD COLUMN IF NOT EXISTS montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0);

-- Étape 2: Mettre à jour les enregistrements existants
-- Par défaut, on considère que tout le montant payé était déclaré
UPDATE payment_plans 
SET montant_declare = COALESCE(montant_paye, 0), 
    montant_non_declare = 0 
WHERE montant_declare IS NULL OR montant_non_declare IS NULL;

-- Étape 3: Ajouter un commentaire pour la documentation
COMMENT ON COLUMN payment_plans.montant_declare IS 'Montant déclaré fiscalement pour ce paiement';
COMMENT ON COLUMN payment_plans.montant_non_declare IS 'Montant non déclaré fiscalement pour ce paiement';

-- Étape 4: Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_payment_plans_montant_declare ON payment_plans(montant_declare);
CREATE INDEX IF NOT EXISTS idx_payment_plans_montant_non_declare ON payment_plans(montant_non_declare);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Exécuter cette requête pour vérifier que les colonnes ont été ajoutées:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_plans' 
-- AND column_name IN ('montant_declare', 'montant_non_declare');
-- ============================================================================


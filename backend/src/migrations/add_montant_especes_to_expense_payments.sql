-- Migration pour ajouter montant_especes à la table expense_payments
-- Cette colonne est nécessaire pour gérer les paiements mixtes (chèque + espèces)

-- Ajouter la colonne montant_especes à la table expense_payments
ALTER TABLE expense_payments 
ADD COLUMN IF NOT EXISTS montant_especes DECIMAL DEFAULT 0 CHECK (montant_especes >= 0);

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN expense_payments.montant_especes IS 'Montant en espèces pour les paiements mixtes (chèque + espèces)';

-- Mettre à jour les contraintes existantes pour inclure montant_especes
-- Supprimer l'ancienne contrainte
ALTER TABLE expense_payments DROP CONSTRAINT IF EXISTS check_montant_coherence;

-- Ajouter une nouvelle contrainte qui inclut montant_especes
ALTER TABLE expense_payments 
ADD CONSTRAINT check_montant_coherence_with_especes 
CHECK (
  montant_paye = montant_declare + montant_non_declare AND
  (
    (mode_paiement = 'espece' AND montant_especes = montant_paye) OR
    (mode_paiement = 'cheque' AND montant_especes = 0) OR
    (mode_paiement = 'cheque_espece' AND montant_especes >= 0) OR
    (mode_paiement = 'virement' AND montant_especes = 0)
  )
);

-- Mettre à jour les données existantes
-- Pour les paiements existants avec mode_paiement = 'espece', mettre montant_especes = montant_paye
UPDATE expense_payments 
SET montant_especes = montant_paye 
WHERE mode_paiement = 'espece';

-- Pour les autres modes, laisser montant_especes = 0 (déjà par défaut)

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Colonne montant_especes ajoutée à expense_payments avec succès !';
  RAISE NOTICE '📊 Données existantes mises à jour pour les paiements en espèces';
END $$;

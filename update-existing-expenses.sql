-- 🔄 MISE À JOUR DES DÉPENSES EXISTANTES
-- Exécutez ce script après avoir appliqué fix-final-unique.sql

-- Mettre à jour toutes les dépenses avec les totaux calculés
UPDATE expenses 
SET 
    montant_total_paye = COALESCE((
        SELECT SUM(CAST(montant_paye AS DECIMAL))
        FROM expense_payment_plans 
        WHERE expense_id = expenses.id
    ), 0),
    montant_restant = montant_total - COALESCE((
        SELECT SUM(CAST(montant_paye AS DECIMAL))
        FROM expense_payment_plans 
        WHERE expense_id = expenses.id
    ), 0),
    statut_paiement = CASE 
        WHEN COALESCE((
            SELECT SUM(CAST(montant_paye AS DECIMAL))
            FROM expense_payment_plans 
            WHERE expense_id = expenses.id
        ), 0) = 0 THEN 'non_paye'
        WHEN COALESCE((
            SELECT SUM(CAST(montant_paye AS DECIMAL))
            FROM expense_payment_plans 
            WHERE expense_id = expenses.id
        ), 0) >= montant_total THEN 'paye'
        ELSE 'partiellement_paye'
    END;

-- Vérifier les résultats
SELECT 
    nom,
    montant_total,
    montant_total_paye,
    montant_restant,
    statut_paiement,
    (SELECT COUNT(*) FROM expense_payment_plans WHERE expense_id = expenses.id) as nb_paiements
FROM expenses 
ORDER BY created_at DESC;

-- Message de confirmation
SELECT 'MISE À JOUR TERMINÉE - Rechargez votre application !' as resultat;

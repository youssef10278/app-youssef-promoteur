-- 🧪 TEST DE LA VALIDATION DES SURPAIEMENTS
-- Exécutez ce script pour tester que la validation fonctionne

-- 1. Vérifier l'état actuel de la dépense "menuisier"
SELECT 
    e.nom,
    e.montant_total,
    e.montant_total_paye,
    e.montant_restant,
    e.statut_paiement,
    (SELECT COUNT(*) FROM expense_payment_plans WHERE expense_id = e.id) as nb_paiements,
    (SELECT SUM(CAST(montant_paye AS DECIMAL)) FROM expense_payment_plans WHERE expense_id = e.id) as total_calcule
FROM expenses e 
WHERE e.nom = 'menuisier'
ORDER BY e.created_at DESC
LIMIT 1;

-- 2. Lister tous les paiements existants pour cette dépense
SELECT 
    epp.numero_echeance,
    epp.montant_paye,
    epp.date_paiement,
    epp.mode_paiement,
    epp.statut
FROM expense_payment_plans epp
JOIN expenses e ON epp.expense_id = e.id
WHERE e.nom = 'menuisier'
ORDER BY epp.numero_echeance;

-- 3. Calculer le montant maximum autorisé pour un nouveau paiement
WITH expense_info AS (
    SELECT 
        e.id,
        e.nom,
        e.montant_total,
        COALESCE(SUM(CAST(epp.montant_paye AS DECIMAL)), 0) as total_paye
    FROM expenses e
    LEFT JOIN expense_payment_plans epp ON epp.expense_id = e.id
    WHERE e.nom = 'menuisier'
    GROUP BY e.id, e.nom, e.montant_total
)
SELECT 
    nom,
    montant_total,
    total_paye,
    (montant_total - total_paye) as montant_max_autorise,
    CASE 
        WHEN (montant_total - total_paye) <= 0 THEN 'AUCUN PAIEMENT SUPPLÉMENTAIRE AUTORISÉ'
        ELSE CONCAT('Paiement maximum autorisé: ', (montant_total - total_paye), ' DH')
    END as message
FROM expense_info;

-- Message de fin
SELECT '✅ VALIDATION PRÊTE - Testez maintenant dans l''application !' as resultat;

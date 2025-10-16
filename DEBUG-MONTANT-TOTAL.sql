-- DEBUG MONTANT TOTAL - A executer dans pgAdmin 4
-- Pour identifier pourquoi le montant total affiche 5.050 DH au lieu de 100 DH

-- 1. Identifier la depense problematique (celle avec 50 DH + 50 DH)
SELECT 
    e.id,
    e.nom,
    e.montant_declare as table_montant_declare,
    e.montant_non_declare as table_montant_non_declare,
    e.montant_total as table_montant_total,
    e.montant_cheque as table_montant_cheque,
    e.montant_espece as table_montant_espece
FROM expenses e
WHERE e.nom ILIKE '%test%' OR e.nom ILIKE '%alomrane%'
ORDER BY e.created_at DESC
LIMIT 10;

-- 2. Verifier les paiements pour cette depense
-- Remplacez 'EXPENSE_ID_ICI' par l'ID de la depense problematique
SELECT 
    ep.id,
    ep.expense_id,
    ep.montant_paye,
    ep.montant_declare,
    ep.montant_non_declare,
    ep.montant_especes,
    ep.mode_paiement,
    ep.created_at
FROM expense_payments ep
WHERE ep.expense_id IN (
    SELECT e.id FROM expenses e 
    WHERE e.nom ILIKE '%test%' OR e.nom ILIKE '%alomrane%'
    ORDER BY e.created_at DESC 
    LIMIT 5
)
ORDER BY ep.created_at DESC;

-- 3. Verifier la vue expenses_with_totals pour ces depenses
SELECT 
    ewt.id,
    ewt.nom,
    ewt.total_paye_calcule,
    ewt.total_declare_calcule,
    ewt.total_non_declare_calcule,
    ewt.nombre_paiements,
    -- Calcul manuel pour verification
    (ewt.total_declare_calcule + ewt.total_non_declare_calcule) as montant_total_affiche
FROM expenses_with_totals ewt
WHERE ewt.nom ILIKE '%test%' OR ewt.nom ILIKE '%alomrane%'
ORDER BY ewt.created_at DESC
LIMIT 10;

-- 4. Diagnostic detaille pour une depense specifique
-- Remplacez 'EXPENSE_ID_ICI' par l'ID de votre depense problematique
-- SELECT 
--     'DEPENSE' as type,
--     e.nom,
--     e.montant_declare,
--     e.montant_non_declare,
--     e.montant_total,
--     e.montant_cheque,
--     e.montant_espece
-- FROM expenses e
-- WHERE e.id = 'EXPENSE_ID_ICI'
-- UNION ALL
-- SELECT 
--     'PAIEMENT' as type,
--     ep.mode_paiement as nom,
--     ep.montant_declare,
--     ep.montant_non_declare,
--     ep.montant_paye as montant_total,
--     (ep.montant_paye - ep.montant_especes) as montant_cheque,
--     ep.montant_especes as montant_espece
-- FROM expense_payments ep
-- WHERE ep.expense_id = 'EXPENSE_ID_ICI';

-- 5. Identifier les depenses avec des montants incoherents
SELECT 
    ewt.id,
    ewt.nom,
    ewt.total_paye_calcule,
    ewt.total_declare_calcule,
    ewt.total_non_declare_calcule,
    (ewt.total_declare_calcule + ewt.total_non_declare_calcule) as somme_declare_non_declare,
    CASE 
        WHEN ABS(ewt.total_paye_calcule - (ewt.total_declare_calcule + ewt.total_non_declare_calcule)) > 0.01 
        THEN 'INCOHERENT' 
        ELSE 'COHERENT' 
    END as coherence,
    ABS(ewt.total_paye_calcule - (ewt.total_declare_calcule + ewt.total_non_declare_calcule)) as difference
FROM expenses_with_totals ewt
WHERE ewt.nombre_paiements > 0
ORDER BY difference DESC
LIMIT 20;

-- 6. Message d'aide
SELECT 
    'INSTRUCTIONS' as type,
    'Cherchez la depense avec 50 DH + 50 DH dans les resultats ci-dessus' as message,
    'Puis remplacez EXPENSE_ID_ICI par son ID dans la requete 4' as action;

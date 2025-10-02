-- Script pour corriger l'ENUM payment_method
-- Ajouter la valeur 'cheque_espece' qui est utilisée par le frontend

-- Ajouter la nouvelle valeur à l'ENUM
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cheque_espece';

-- Optionnel : Mettre à jour les données existantes si nécessaire
-- UPDATE expenses SET methode_paiement = 'cheque_espece' WHERE methode_paiement = 'cheque_et_espece';
-- UPDATE sales SET mode_paiement = 'cheque_espece' WHERE mode_paiement = 'cheque_et_espece';
-- UPDATE payment_plans SET mode_paiement = 'cheque_espece' WHERE mode_paiement = 'cheque_et_espece';

-- Vérifier les valeurs de l'ENUM
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method') ORDER BY enumsortorder;

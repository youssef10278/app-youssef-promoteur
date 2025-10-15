-- Migration pour supprimer complètement le système d'import/export
-- Date: 2025-10-15
-- Description: Suppression de la table data_operations et nettoyage

-- Supprimer la table data_operations si elle existe
DROP TABLE IF EXISTS data_operations CASCADE;

-- Vérifier que la table a été supprimée
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name = 'data_operations';

-- Cette requête ne devrait retourner aucun résultat après la suppression

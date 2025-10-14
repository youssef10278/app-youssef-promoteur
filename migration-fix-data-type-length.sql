-- =====================================================
-- MIGRATION: Correction de la longueur du champ data_type
-- Date: 2024-12-14
-- Description: Augmenter la taille de data_type pour supporter les exports multiples
-- =====================================================

-- Augmenter la taille de la colonne data_type de VARCHAR(20) à VARCHAR(100)
ALTER TABLE data_operations 
ALTER COLUMN data_type TYPE VARCHAR(100);

-- Vérification de la modification
DO $$
DECLARE
    column_length INTEGER;
BEGIN
    -- Récupérer la longueur maximale de la colonne
    SELECT character_maximum_length 
    INTO column_length
    FROM information_schema.columns 
    WHERE table_name = 'data_operations' 
    AND column_name = 'data_type';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION data_type TERMINÉE !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nouvelle taille data_type: % caractères', column_length;
    RAISE NOTICE 'Export multi-types maintenant supporté !';
END $$;

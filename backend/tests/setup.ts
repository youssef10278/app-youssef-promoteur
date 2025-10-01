/**
 * Configuration globale pour les tests Jest
 * Ce fichier est exécuté AVANT tous les tests
 */

// Définir les variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-12345678901234567890';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-12345678901234567890';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Configuration de la base de données de test
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'promoteur_db';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Désactiver les logs pendant les tests (optionnel)
// console.log = jest.fn();
// console.error = jest.fn();
// console.warn = jest.fn();


import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import logger, { logQuery } from '../utils/logger';

dotenv.config();

// Configuration explicite pour éviter les conflits
const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000 // Augmenté à 10 secondes
};

// Log de la configuration pour debug
logger.info('Configuration PostgreSQL', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password ? '***' : 'VIDE'
});

// Pour Railway en production, utiliser DATABASE_URL
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = { rejectUnauthorized: false };
  logger.info('Utilisation de DATABASE_URL pour la production');
}

export const pool = new Pool(config);

// Test de connexion
pool.on('connect', () => {
  logger.info('Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  logger.error('Erreur PostgreSQL', { error: err.message, stack: err.stack });
  process.exit(-1);
});

// Fonction utilitaire pour exécuter des requêtes
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  let client;

  try {
    // Obtenir une connexion du pool
    client = await pool.connect();

    // Exécuter la requête
    const res = await client.query(text, params);
    const duration = Date.now() - start;

    // Logger la requête
    logQuery(text, params || [], duration);

    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Erreur de requête', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    throw error;
  } finally {
    // Libérer la connexion
    if (client) {
      client.release();
    }
  }
};

// Fonction pour fermer la connexion proprement
export const closePool = async () => {
  await pool.end();
  logger.info('Connexion PostgreSQL fermée');
};

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

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
console.log('🔧 Configuration PostgreSQL:', {
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
  console.log('🚀 Utilisation de DATABASE_URL pour la production');
}

export const pool = new Pool(config);

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
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
    
    console.log('📊 Requête exécutée', { 
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
      duration, 
      rows: res.rowCount 
    });
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Erreur de requête:', { 
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
      duration,
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
  console.log('🔌 Connexion PostgreSQL fermée');
};

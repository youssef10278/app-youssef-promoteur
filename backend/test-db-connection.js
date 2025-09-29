const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Pour Railway en production
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = { rejectUnauthorized: false };
}

console.log('🔧 Configuration PostgreSQL:');
console.log({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password ? '***' : 'VIDE',
  hasConnectionString: !!config.connectionString,
  ssl: config.ssl
});

const pool = new Pool(config);

async function testConnection() {
  console.log('\n🧪 Test de connexion à la base de données...');
  
  try {
    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion établie avec succès');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Requête test réussie:', result.rows[0]);
    
    // Test de la table users
    try {
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('✅ Table users accessible:', usersResult.rows[0]);
    } catch (error) {
      console.log('❌ Erreur table users:', error.message);
    }
    
    // Test de la table projects
    try {
      const projectsResult = await client.query('SELECT COUNT(*) as count FROM projects');
      console.log('✅ Table projects accessible:', projectsResult.rows[0]);
    } catch (error) {
      console.log('❌ Erreur table projects:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Détails:', error);
  } finally {
    await pool.end();
    console.log('🔌 Connexion fermée');
  }
}

// Test des variables d'environnement
console.log('\n🔍 Variables d\'environnement:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'VIDE');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***' : 'VIDE');

testConnection();

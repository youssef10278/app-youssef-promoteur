const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3002; // Port différent pour éviter les conflits

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la base de données
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Augmenté pour éviter les timeouts
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

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
});

// Fonction utilitaire pour exécuter des requêtes
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Requête exécutée', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erreur de requête:', { text: text.substring(0, 50) + '...', error: error.message });
    throw error;
  }
};

// Route de test de base
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route de test de connexion DB
app.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Connexion DB OK'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur de connexion DB'
    });
  }
});

// Route de test des tables
app.get('/test-tables', async (req, res) => {
  try {
    const results = {};
    
    // Test table users
    try {
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      results.users = { success: true, count: usersResult.rows[0].count };
    } catch (error) {
      results.users = { success: false, error: error.message };
    }
    
    // Test table projects
    try {
      const projectsResult = await query('SELECT COUNT(*) as count FROM projects');
      results.projects = { success: true, count: projectsResult.rows[0].count };
    } catch (error) {
      results.projects = { success: false, error: error.message };
    }
    
    // Test table expenses
    try {
      const expensesResult = await query('SELECT COUNT(*) as count FROM expenses');
      results.expenses = { success: true, count: expensesResult.rows[0].count };
    } catch (error) {
      results.expenses = { success: false, error: error.message };
    }
    
    res.json({
      success: true,
      data: results,
      message: 'Test des tables terminé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors du test des tables'
    });
  }
});

// Route de test des requêtes problématiques
app.get('/test-problematic-queries', async (req, res) => {
  try {
    const results = {};
    
    // Test requête auth/profile (simulée avec un userId fictif)
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const authResult = await query(
        'SELECT id, email, nom, telephone, societe, created_at, updated_at FROM users WHERE id = $1',
        [testUserId]
      );
      results.auth_profile = { 
        success: true, 
        rows: authResult.rows.length,
        message: 'Requête auth/profile fonctionne (même si pas de résultat)'
      };
    } catch (error) {
      results.auth_profile = { success: false, error: error.message };
    }
    
    // Test requête projects/stats (simulée avec un userId fictif)
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const statsResult = await query(
        `SELECT
           COUNT(*) as total_projects,
           COALESCE(SUM(surface_totale), 0) as total_surface,
           COALESCE(SUM(nombre_lots), 0) as total_lots,
           COALESCE(AVG(surface_totale), 0) as average_surface
         FROM projects
         WHERE user_id = $1`,
        [testUserId]
      );
      results.projects_stats = { 
        success: true, 
        data: statsResult.rows[0],
        message: 'Requête projects/stats fonctionne'
      };
    } catch (error) {
      results.projects_stats = { success: false, error: error.message };
    }
    
    res.json({
      success: true,
      data: results,
      message: 'Test des requêtes problématiques terminé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors du test des requêtes'
    });
  }
});

// Route de test avec un vrai utilisateur
app.get('/test-real-user', async (req, res) => {
  try {
    // Récupérer un utilisateur existant
    const usersResult = await query('SELECT id, email FROM users LIMIT 1');
    
    if (usersResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Aucun utilisateur trouvé dans la base de données'
      });
    }
    
    const userId = usersResult.rows[0].id;
    const results = {};
    
    // Test auth/profile avec un vrai utilisateur
    try {
      const authResult = await query(
        'SELECT id, email, nom, telephone, societe, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      results.auth_profile = { 
        success: true, 
        data: authResult.rows[0],
        message: 'Requête auth/profile réussie'
      };
    } catch (error) {
      results.auth_profile = { success: false, error: error.message };
    }
    
    // Test projects/stats avec un vrai utilisateur
    try {
      const statsResult = await query(
        `SELECT
           COUNT(*) as total_projects,
           COALESCE(SUM(surface_totale), 0) as total_surface,
           COALESCE(SUM(nombre_lots), 0) as total_lots,
           COALESCE(AVG(surface_totale), 0) as average_surface
         FROM projects
         WHERE user_id = $1`,
        [userId]
      );
      results.projects_stats = { 
        success: true, 
        data: statsResult.rows[0],
        message: 'Requête projects/stats réussie'
      };
    } catch (error) {
      results.projects_stats = { success: false, error: error.message };
    }
    
    res.json({
      success: true,
      data: results,
      userId: userId,
      message: 'Test avec utilisateur réel terminé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors du test avec utilisateur réel'
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de diagnostic démarré sur le port ${PORT}`);
  console.log(`🔍 Testez les routes suivantes:`);
  console.log(`   - http://localhost:${PORT}/health`);
  console.log(`   - http://localhost:${PORT}/test-db`);
  console.log(`   - http://localhost:${PORT}/test-tables`);
  console.log(`   - http://localhost:${PORT}/test-problematic-queries`);
  console.log(`   - http://localhost:${PORT}/test-real-user`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', async () => {
  console.log('🛑 Arrêt du serveur de diagnostic...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur de diagnostic...');
  await pool.end();
  process.exit(0);
});

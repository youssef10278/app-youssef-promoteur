const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'promoteur_db',
    user: 'postgres',
    password: 'password'
  });

  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Connexion réussie:', result.rows);
    await pool.end();
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    await pool.end();
  }
}

testConnection();

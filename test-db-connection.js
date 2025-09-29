// Test de connexion à la base de données
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://promoteur_user:promoteur_password@localhost:5433/promoteur_db'
});

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à PostgreSQL...');
    
    const client = await pool.connect();
    console.log('✅ Connexion réussie !');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Heure actuelle:', result.rows[0].current_time);
    
    client.release();
    await pool.end();
    
    console.log('🎉 Base de données accessible !');
    return true;
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

testConnection();

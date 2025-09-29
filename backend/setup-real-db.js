const { Pool } = require('pg');
const fs = require('fs');

async function setupDatabase() {
  console.log('🔧 Configuration de la base de données réelle...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'promoteur_db',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    // Test de connexion
    console.log('🔍 Test de connexion...');
    await pool.query('SELECT 1');
    console.log('✅ Connexion réussie !');

    // Lecture et exécution du script SQL
    console.log('📄 Lecture du script SQL...');
    const sqlScript = fs.readFileSync('../create-tables.sql', 'utf8');
    
    console.log('🚀 Création des tables...');
    await pool.query(sqlScript);
    
    console.log('✅ Tables créées avec succès !');
    
    // Vérification
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables créées :');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();

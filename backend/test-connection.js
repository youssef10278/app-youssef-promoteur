const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Test de connexion avec la base postgres par défaut...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Base par défaut
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connexion réussie avec mot de passe "postgres" !');
    
    // Créer la base de données
    console.log('🚀 Création de la base promoteur_db...');
    await pool.query('CREATE DATABASE promoteur_db;');
    console.log('✅ Base de données promoteur_db créée !');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Base de données promoteur_db existe déjà !');
    } else {
      console.error('❌ Erreur :', error.message);
    }
  } finally {
    await pool.end();
  }
}

testConnection();

const { Pool } = require('pg');

const passwords = ['0002', '002', '', 'postgres', 'admin', 'password'];

async function testPasswords() {
  console.log('🔍 Test des mots de passe possibles...\n');
  
  for (const password of passwords) {
    console.log(`🧪 Test avec mot de passe: "${password}"`);
    
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'promoteur_db',
      user: 'postgres',
      password: password
    });

    try {
      await pool.query('SELECT 1');
      console.log(`✅ SUCCÈS avec mot de passe: "${password}"\n`);
      await pool.end();
      return password;
    } catch (error) {
      console.log(`❌ Échec: ${error.message}\n`);
      await pool.end();
    }
  }
  
  console.log('❌ Aucun mot de passe ne fonctionne');
  return null;
}

testPasswords();

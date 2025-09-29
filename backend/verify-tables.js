const { Pool } = require('pg');

async function verifyTables() {
  console.log('🔍 Vérification des tables dans promoteur_db...\n');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'promoteur_db',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    // Liste des tables
    const tablesResult = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables trouvées :');
    console.log('==================');
    tablesResult.rows.forEach(row => {
      console.log(`✅ ${row.table_name} (${row.column_count} colonnes)`);
    });
    
    console.log(`\n📊 Total : ${tablesResult.rows.length} tables créées\n`);
    
    // Vérification détaillée de chaque table
    for (const table of tablesResult.rows) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [table.table_name]);
      
      console.log(`🔧 Structure de la table "${table.table_name}" :`);
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

verifyTables();

import { Pool } from 'pg';

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/promoteur_app'
});

async function testProjectValidation() {
  console.log('🧪 Test de validation des modifications de projet\n');

  try {
    // 1. Créer un projet de test avec 20 appartements
    console.log('1️⃣ Création d\'un projet de test avec 20 appartements...');
    const createProjectResult = await pool.query(
      `INSERT INTO projects (user_id, nom, localisation, societe, surface_totale, nombre_lots, nombre_appartements, nombre_garages, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nom, nombre_appartements`,
      [1, 'Projet Test Validation', 'Casablanca', 'Test SARL', 5000, 50, 20, 10, 'Projet pour tester la validation']
    );
    
    const projectId = createProjectResult.rows[0].id;
    console.log(`✅ Projet créé: ID ${projectId}, ${createProjectResult.rows[0].nombre_appartements} appartements`);

    // 2. Créer des ventes pour 15 appartements
    console.log('\n2️⃣ Création de 15 ventes d\'appartements...');
    const sales = [];
    for (let i = 1; i <= 15; i++) {
      const saleResult = await pool.query(
        `INSERT INTO sales (user_id, project_id, client_nom, client_telephone, client_email, type_unite, prix_total, avance_total, statut, date_vente)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [1, projectId, `Client ${i}`, `012345678${i}`, `client${i}@test.com`, 'appartement', 500000 + (i * 10000), 100000 + (i * 5000), 'en_cours', new Date()]
      );
      sales.push(saleResult.rows[0].id);
    }
    console.log(`✅ ${sales.length} ventes créées`);

    // 3. Tester la modification qui devrait échouer (réduire à 2 appartements)
    console.log('\n3️⃣ Test de modification qui devrait échouer (réduire à 2 appartements)...');
    try {
      await pool.query(
        'UPDATE projects SET nombre_appartements = $1 WHERE id = $2',
        [2, projectId]
      );
      console.log('❌ ERREUR: La modification aurait dû échouer !');
    } catch (error) {
      console.log('✅ Validation fonctionne: Modification bloquée');
      console.log(`   Message d'erreur: ${error.message}`);
    }

    // 4. Tester la modification qui devrait réussir (augmenter à 25 appartements)
    console.log('\n4️⃣ Test de modification qui devrait réussir (augmenter à 25 appartements)...');
    try {
      await pool.query(
        'UPDATE projects SET nombre_appartements = $1 WHERE id = $2',
        [25, projectId]
      );
      console.log('✅ Modification réussie: Augmentation autorisée');
    } catch (error) {
      console.log('❌ ERREUR: L\'augmentation aurait dû réussir !');
      console.log(`   Message d'erreur: ${error.message}`);
    }

    // 5. Tester la modification qui devrait échouer (réduire à 10 appartements)
    console.log('\n5️⃣ Test de modification qui devrait échouer (réduire à 10 appartements)...');
    try {
      await pool.query(
        'UPDATE projects SET nombre_appartements = $1 WHERE id = $2',
        [10, projectId]
      );
      console.log('❌ ERREUR: La modification aurait dû échouer !');
    } catch (error) {
      console.log('✅ Validation fonctionne: Modification bloquée');
      console.log(`   Message d'erreur: ${error.message}`);
    }

    // 6. Nettoyer les données de test
    console.log('\n6️⃣ Nettoyage des données de test...');
    await pool.query('DELETE FROM sales WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 Test de validation terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le test
testProjectValidation();

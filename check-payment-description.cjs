const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Youssef2001@localhost:5432/promoteur_app'
});

async function checkPaymentDescription() {
  try {
    console.log('🔍 Vérification de la description du paiement #1...\n');
    
    // Récupérer tous les paiements #1 (avance initiale)
    const result = await pool.query(`
      SELECT 
        pp.id,
        pp.sale_id,
        pp.numero_echeance,
        pp.description,
        pp.montant_paye,
        pp.mode_paiement,
        pp.created_at,
        s.client_nom,
        s.unite_numero
      FROM payment_plans pp
      LEFT JOIN sales s ON pp.sale_id = s.id
      WHERE pp.numero_echeance = 1
      ORDER BY pp.created_at DESC
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Aucun paiement #1 trouvé dans la base de données');
      return;
    }
    
    console.log(`✅ ${result.rows.length} paiement(s) #1 trouvé(s):\n`);
    
    result.rows.forEach((plan, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Paiement ${index + 1}:`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Vente: ${plan.client_nom} - ${plan.unite_numero}`);
      console.log(`   Numéro échéance: ${plan.numero_echeance}`);
      console.log(`   📝 DESCRIPTION: "${plan.description}"`);
      console.log(`   Montant: ${plan.montant_paye} DH`);
      console.log(`   Mode: ${plan.mode_paiement}`);
      console.log(`   Créé le: ${plan.created_at}`);
      
      // Vérifier si la description contient "Avance initiale"
      if (plan.description && plan.description.includes('Avance initiale')) {
        console.log(`   ✅ Contient "Avance initiale"`);
      } else {
        console.log(`   ❌ NE CONTIENT PAS "Avance initiale" - C'EST LE PROBLÈME !`);
      }
      console.log('');
    });
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Vérifier spécifiquement le paiement que vous venez de modifier
    console.log('🔍 Recherche du dernier paiement modifié...\n');
    
    const lastModified = await pool.query(`
      SELECT 
        pp.id,
        pp.sale_id,
        pp.numero_echeance,
        pp.description,
        pp.montant_paye,
        pp.mode_paiement,
        pp.updated_at,
        s.client_nom,
        s.unite_numero
      FROM payment_plans pp
      LEFT JOIN sales s ON pp.sale_id = s.id
      WHERE pp.numero_echeance = 1
      ORDER BY pp.updated_at DESC
      LIMIT 1
    `);
    
    if (lastModified.rows.length > 0) {
      const plan = lastModified.rows[0];
      console.log(`📋 Dernier paiement #1 modifié:`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Vente: ${plan.client_nom} - ${plan.unite_numero}`);
      console.log(`   📝 DESCRIPTION: "${plan.description}"`);
      console.log(`   Montant: ${plan.montant_paye} DH`);
      console.log(`   Modifié le: ${plan.updated_at}`);
      
      if (plan.description && plan.description.includes('Avance initiale')) {
        console.log(`   ✅ La description est correcte`);
      } else {
        console.log(`   ❌ PROBLÈME: La description devrait contenir "Avance initiale"`);
        console.log(`   💡 Solution: Mettre à jour la description pour inclure "Avance initiale"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkPaymentDescription();


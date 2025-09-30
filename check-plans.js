import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/promoteur_app'
});

async function checkPlans() {
  try {
    const result = await pool.query(
      'SELECT id, sale_id, numero_echeance, montant_paye, mode_paiement, created_at FROM payment_plans WHERE sale_id = $1 ORDER BY numero_echeance', 
      ['90c7c14e-5909-43d4-8780-0997521ecacf']
    );
    
    console.log('Plans dans la base de données:');
    result.rows.forEach(plan => {
      console.log(`- Plan ${plan.numero_echeance}: ${plan.montant_paye} DH (${plan.mode_paiement}) - ${plan.created_at}`);
    });
    console.log(`Total: ${result.rows.length} plans`);
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkPlans();

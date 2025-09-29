// Test simple de l'API des chèques
const API_BASE_URL = 'http://localhost:3001/api';

async function testCheckAPI() {
  try {
    console.log('🧪 Test de l\'API des chèques...');
    
    // 1. Connexion
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abranto.shop@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Échec de la connexion');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');
    
    // 2. Récupérer les chèques existants
    const checksResponse = await fetch(`${API_BASE_URL}/checks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!checksResponse.ok) {
      throw new Error(`Erreur récupération chèques: ${checksResponse.status}`);
    }
    
    const checksData = await checksResponse.json();
    const checks = checksData.data || [];
    
    console.log(`✅ ${checks.length} chèques trouvés`);
    
    // Afficher les chèques "donnés" (émis)
    const donneChecks = checks.filter(check => check.type_cheque === 'donne');
    console.log(`📋 ${donneChecks.length} chèques donnés (émis):`);
    
    donneChecks.forEach((check, index) => {
      console.log(`  ${index + 1}. ${check.numero_cheque} - ${check.montant} DH - ${check.statut} - ${check.description}`);
    });
    
    console.log('🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCheckAPI();


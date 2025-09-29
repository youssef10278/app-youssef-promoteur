// Test pour vérifier que les numéros de chèques sont maintenant corrects
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (data && method !== 'GET') config.body = JSON.stringify(data);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testNumerosCheques() {
  try {
    log('\n🔢 TEST DES NUMÉROS DE CHÈQUES RÉELS', 'blue');
    log('=' .repeat(50), 'blue');

    // 1. Créer un utilisateur de test
    log('\n1. Création d\'un utilisateur de test...', 'yellow');
    const userData = {
      email: 'test-numero@example.com',
      password: 'password123',
      nom: 'Test Numéro',
      telephone: '0123456789',
      societe: 'Test Company'
    };

    const registerResult = await testEndpoint('/auth/register', 'POST', userData);
    let authToken = null;

    if (registerResult.success) {
      log('✅ Utilisateur créé avec succès', 'green');
      authToken = registerResult.data.token;
    } else if (registerResult.status === 409) {
      // Utilisateur existe déjà, se connecter
      log('ℹ️ Utilisateur existe déjà, connexion...', 'cyan');
      const loginResult = await testEndpoint('/auth/login', 'POST', {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResult.success) {
        log('✅ Connexion réussie', 'green');
        authToken = loginResult.data.token;
      } else {
        log('❌ Échec de la connexion', 'red');
        return;
      }
    } else {
      log('❌ Échec de la création de l\'utilisateur', 'red');
      console.log(registerResult);
      return;
    }

    // 2. Créer un projet de test
    log('\n2. Création d\'un projet de test...', 'yellow');
    const projectData = {
      nom: 'Projet Test Numéros',
      localisation: 'Test Location',
      societe: 'Test Company',
      surface_totale: 1000,
      nombre_lots: 10,
      nombre_appartements: 8,
      nombre_garages: 2,
      description: 'Projet pour tester les numéros de chèques'
    };

    const projectResult = await testEndpoint('/projects', 'POST', projectData, authToken);
    
    if (!projectResult.success) {
      log('❌ Échec de la création du projet', 'red');
      console.log(projectResult);
      return;
    }

    const projectId = projectResult.data.id;
    log(`✅ Projet créé avec succès (ID: ${projectId})`, 'green');

    // 3. Test avec des numéros de chèques spécifiques
    log('\n3. Test avec des numéros de chèques spécifiques...', 'yellow');
    
    const testCases = [
      {
        name: 'Chèque avec numéro réel',
        saleData: {
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A01',
          client_nom: 'Client Test 1',
          client_telephone: '0987654321',
          client_email: 'client1@test.com',
          client_adresse: '123 Rue Test',
          surface: 100,
          prix_total: 300000,
          description: 'Test numéro de chèque réel',
          mode_paiement: 'cheque',
          avance_declare: 100000,
          avance_non_declare: 50000,
          avance_cheque: 150000,
          avance_espece: 0,
          cheques: [
            {
              numero: 'CHQ123456789', // Numéro réel
              banque: 'Banque Populaire',
              montant: 150000,
              date_echeance: '2024-01-15'
            }
          ]
        },
        expectedNumero: 'CHQ123456789'
      },
      {
        name: 'Chèque sans détails (automatique)',
        saleData: {
          project_id: projectId,
          type_propriete: 'garage',
          unite_numero: 'G01',
          client_nom: 'Client Test 2',
          client_telephone: '0987654322',
          client_email: 'client2@test.com',
          client_adresse: '456 Rue Test',
          surface: 25,
          prix_total: 100000,
          description: 'Test chèque automatique',
          mode_paiement: 'cheque',
          avance_declare: 50000,
          avance_non_declare: 30000,
          avance_cheque: 80000,
          avance_espece: 0
          // Pas de chèques détaillés
        },
        expectedPattern: /^CHQ-.+-001$/
      }
    ];

    for (const testCase of testCases) {
      log(`\n📋 ${testCase.name}:`, 'cyan');
      
      const saleResult = await testEndpoint('/sales', 'POST', testCase.saleData, authToken);
      
      if (saleResult.success) {
        const saleId = saleResult.data.id;
        log(`  ✅ Vente créée (ID: ${saleId})`, 'green');
        
        // Attendre un peu pour que la création soit terminée
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier les chèques créés
        const checksResult = await testEndpoint('/checks', 'GET', null, authToken);
        
        if (checksResult.success) {
          const checks = checksResult.data.data || [];
          const saleChecks = checks.filter(check => check.sale_id === saleId);
          
          if (saleChecks.length > 0) {
            saleChecks.forEach((check, index) => {
              log(`  💳 Chèque ${index + 1}:`, 'green');
              log(`    - Numéro: ${check.numero_cheque}`, 'green');
              log(`    - Montant: ${check.montant} DH`, 'green');
              log(`    - Description: ${check.description}`, 'green');
              
              // Vérifier le numéro
              if (testCase.expectedNumero) {
                if (check.numero_cheque === testCase.expectedNumero) {
                  log(`    ✅ NUMÉRO CORRECT: ${check.numero_cheque}`, 'green');
                } else {
                  log(`    ❌ NUMÉRO INCORRECT: attendu ${testCase.expectedNumero}, reçu ${check.numero_cheque}`, 'red');
                }
              } else if (testCase.expectedPattern) {
                if (testCase.expectedPattern.test(check.numero_cheque)) {
                  log(`    ✅ PATTERN CORRECT: ${check.numero_cheque}`, 'green');
                } else {
                  log(`    ❌ PATTERN INCORRECT: ${check.numero_cheque}`, 'red');
                }
              }
            });
          } else {
            log(`  ❌ Aucun chèque trouvé pour cette vente`, 'red');
          }
        } else {
          log(`  ❌ Erreur lors de la récupération des chèques`, 'red');
        }
      } else {
        log(`  ❌ Échec de la création de la vente`, 'red');
        console.log(saleResult);
      }
    }

    // 4. Instructions pour vérifier dans l'interface
    log('\n📝 INSTRUCTIONS POUR VÉRIFIER DANS L\'INTERFACE:', 'blue');
    log('=' .repeat(50), 'blue');
    log('1. Allez dans l\'interface web (http://localhost:5173)', 'cyan');
    log('2. Créez une nouvelle vente avec paiement par chèque', 'cyan');
    log('3. Saisissez un numéro de chèque spécifique (ex: CHQ987654321)', 'cyan');
    log('4. Allez dans "Gestion des Chèques" > "Chèques Reçus"', 'cyan');
    log('5. Vérifiez que le numéro affiché correspond exactement à celui saisi', 'cyan');

    log('\n✅ Test des numéros de chèques terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testNumerosCheques();

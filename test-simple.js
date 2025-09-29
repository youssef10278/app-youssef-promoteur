// Test simple des APIs
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testAPI() {
  console.log('🚀 Test des APIs de base...\n');

  // Test 1: Health check
  try {
    console.log('1. Test Health Check...');
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health Check OK:', data.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: Route de base
  try {
    console.log('\n2. Test Route de base...');
    const response = await fetch(`${API_BASE}/`);
    const data = await response.json();
    console.log('✅ Route de base OK:', data.message);
  } catch (error) {
    console.log('❌ Route de base Failed:', error.message);
  }

  // Test 3: Test d'inscription (sans base de données)
  try {
    console.log('\n3. Test API Auth (inscription)...');
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
        nom: 'Test User'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 500) {
      console.log('⚠️  API Auth accessible mais erreur DB (normal sans PostgreSQL)');
      console.log('   Message:', data.error || data.message);
    } else {
      console.log('✅ API Auth OK');
    }
  } catch (error) {
    console.log('❌ API Auth Failed:', error.message);
  }

  console.log('\n🎉 Tests terminés !');
  console.log('\n💡 Pour des tests complets, configurez PostgreSQL et relancez test-migration.js');
}

testAPI();

/**
 * Script de test pour l'EventBus
 * Utilisé pour vérifier que les événements fonctionnent correctement
 */

import { eventBus, EVENTS } from './eventBus';

export const testEventBus = () => {
  console.log('🧪 Test de l\'EventBus...');

  // Test 1: Abonnement et émission d'événement
  const unsubscribe = eventBus.on(EVENTS.CHECK_CREATED, (data) => {
    console.log('✅ Événement CHECK_CREATED reçu:', data);
  });

  // Émettre un événement de test
  eventBus.emit(EVENTS.CHECK_CREATED, {
    check: { id: 'test-123', montant: 1000 },
    source: 'test'
  });

  // Test 2: Désabonnement
  unsubscribe();
  
  // Cet événement ne devrait pas être reçu
  eventBus.emit(EVENTS.CHECK_CREATED, {
    check: { id: 'test-456', montant: 2000 },
    source: 'test'
  });

  console.log('🧪 Test de l\'EventBus terminé');
};

// Fonction utilitaire pour déboguer les événements
export const debugEventBus = () => {
  console.log('🔍 Mode debug EventBus activé');
  
  // Écouter tous les événements de chèques
  Object.values(EVENTS).forEach(event => {
    if (event.startsWith('check:')) {
      eventBus.on(event, (data) => {
        console.log(`🔔 [DEBUG] Événement ${event}:`, data);
      });
    }
  });
};

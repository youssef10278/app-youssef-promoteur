// Service Worker personnalisé pour Promoteur Immobilier Pro
const CACHE_NAME = 'promoteur-pro-v1';
const OFFLINE_URL = '/offline.html';

// Ressources essentielles à mettre en cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/dashboard',
  '/auth',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des ressources essentielles');
        return cache.addAll(ESSENTIAL_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erreur lors de l\'installation', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation terminée');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-HTTP
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' || 
      event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              // Mettre en cache la nouvelle ressource
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            });
        })
        .catch(() => {
          // Retourner une image par défaut si hors ligne
          if (event.request.destination === 'image') {
            return new Response(
              '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#6b7280">Image non disponible</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        })
    );
    return;
  }

  // Stratégie Network First pour les pages et API
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback vers le cache si hors ligne
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Page hors ligne pour les navigations
            if (event.request.mode === 'navigate') {
              return caches.match('/') || 
                     new Response(
                       '<!DOCTYPE html><html><head><title>Hors ligne</title></head><body><h1>Application hors ligne</h1><p>Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.</p></body></html>',
                       { headers: { 'Content-Type': 'text/html' } }
                     );
            }
            
            // Réponse par défaut pour les autres requêtes
            return new Response(
              JSON.stringify({ error: 'Hors ligne', message: 'Cette fonctionnalité nécessite une connexion internet' }),
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503,
                statusText: 'Service Unavailable'
              }
            );
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Notification de mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Vérifier s'il y a une nouvelle version
    self.registration.update()
      .then(() => {
        event.ports[0].postMessage({ updateAvailable: true });
      })
      .catch(() => {
        event.ports[0].postMessage({ updateAvailable: false });
      });
  }
});

console.log('Service Worker: Promoteur Immobilier Pro - Chargé avec succès');

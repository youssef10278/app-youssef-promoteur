// Service Worker de désactivation temporaire
// Utilisé en cas de problèmes SSL avec le service worker principal

// Désinstaller le service worker existant
self.addEventListener('install', () => {
  console.log('Service Worker: Désactivation en cours...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Nettoyage des caches...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Service Worker: Suppression du cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Désactivation terminée');
        return self.clients.claim();
      })
  );
});

// Ne pas intercepter les requêtes
self.addEventListener('fetch', (event) => {
  // Laisser passer toutes les requêtes sans interception
  return;
});

console.log('Service Worker: Mode désactivé - Aucune interception des requêtes');

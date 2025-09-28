import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, X, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PWAUpdatePrompt: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
      // Notification désactivée pour éviter de déranger l'utilisateur
      // toast({
      //   title: "Application installée",
      //   description: "L'application est maintenant disponible hors ligne",
      // });
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Gérer le statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Notification désactivée pour éviter de déranger l'utilisateur
      // toast({
      //   title: "Connexion rétablie",
      //   description: "Vous êtes de nouveau en ligne",
      // });
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Notification désactivée pour éviter de déranger l'utilisateur
      // toast({
      //   title: "Mode hors ligne",
      //   description: "L'application continue de fonctionner hors ligne",
      //   variant: "destructive",
      // });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Gérer l'invite d'installation PWA - Désactivé
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // setShowInstallPrompt(true); // Désactivé pour ne pas déranger
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // Notification désactivée pour éviter de déranger l'utilisateur
      // toast({
      //   title: "Application installée",
      //   description: "L'application a été ajoutée à votre écran d'accueil",
      // });
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Indicateur de statut réseau - Affiché seulement si hors ligne */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <Badge
            variant="destructive"
            className="flex items-center gap-1"
          >
            <WifiOff className="h-3 w-3" />
            Hors ligne
          </Badge>
        </div>
      )}



      {/* Prompt de mise à jour */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80 card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {needRefresh ? 'Mise à jour disponible' : 'Application prête'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={close}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>
                {needRefresh
                  ? 'Une nouvelle version est disponible. Cliquez sur "Actualiser" pour la charger.'
                  : 'L\'application est maintenant disponible hors ligne.'}
              </CardDescription>
              
              {needRefresh && (
                <Button
                  onClick={() => updateServiceWorker(true)}
                  className="w-full btn-hero"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

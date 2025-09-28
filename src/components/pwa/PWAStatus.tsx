import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, WifiOff, Download, CheckCircle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAStatus: React.FC = () => {
  const { isInstalled, isOnline, canInstall, isStandalone } = usePWA();

  const handleInstallPrompt = () => {
    // Déclencher l'événement beforeinstallprompt si disponible
    const event = new CustomEvent('pwa-install-prompt');
    window.dispatchEvent(event);
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Statut de l'Application
        </CardTitle>
        <CardDescription>
          Informations sur l'installation et la connectivité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut d'installation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="text-sm font-medium">Installation</span>
          </div>
          <Badge variant={isInstalled ? "default" : "secondary"}>
            {isInstalled ? 'Installée' : 'Non installée'}
          </Badge>
        </div>

        {/* Statut de connectivité */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">Connectivité</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </div>

        {/* Mode d'affichage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStandalone ? 'bg-blue-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium">Mode d'affichage</span>
          </div>
          <Badge variant={isStandalone ? "default" : "outline"}>
            {isStandalone ? 'Application' : 'Navigateur'}
          </Badge>
        </div>

        {/* Fonctionnalités disponibles */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fonctionnalités PWA</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Mode hors ligne</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Cache intelligent</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Mise à jour auto</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Interface native</span>
            </div>
          </div>
        </div>

        {/* Bouton d'installation */}
        {canInstall && !isInstalled && (
          <Button 
            onClick={handleInstallPrompt}
            className="w-full btn-hero"
          >
            <Download className="h-4 w-4 mr-2" />
            Installer l'application
          </Button>
        )}

        {/* Message si déjà installée */}
        {isInstalled && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-green-700 font-medium">
              Application installée avec succès !
            </p>
            <p className="text-xs text-green-600">
              Vous pouvez maintenant l'utiliser hors ligne
            </p>
          </div>
        )}

        {/* Informations sur le cache */}
        {!isOnline && (
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <WifiOff className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-sm text-orange-700 font-medium">
              Mode hors ligne activé
            </p>
            <p className="text-xs text-orange-600">
              Les données en cache sont utilisées
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

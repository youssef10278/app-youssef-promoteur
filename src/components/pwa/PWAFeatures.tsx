import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  Download, 
  RefreshCw, 
  Shield, 
  Zap,
  CheckCircle,
  Star
} from 'lucide-react';

export const PWAFeatures: React.FC = () => {
  const features = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Installation Native",
      description: "Installez l'app sur votre écran d'accueil",
      status: "active",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: <Wifi className="h-5 w-5" />,
      title: "Mode Hors Ligne",
      description: "Fonctionne sans connexion internet",
      status: "active",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: "Mises à Jour Auto",
      description: "Mise à jour automatique en arrière-plan",
      status: "active",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Performance Optimisée",
      description: "Chargement rapide avec cache intelligent",
      status: "active",
      color: "bg-yellow-50 text-yellow-600"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Sécurisé HTTPS",
      description: "Connexion sécurisée et chiffrée",
      status: "active",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "Raccourcis Rapides",
      description: "Accès direct aux fonctions principales",
      status: "active",
      color: "bg-indigo-50 text-indigo-600"
    }
  ];

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Fonctionnalités PWA
            </CardTitle>
            <CardDescription>
              Application Web Progressive avec toutes les fonctionnalités modernes
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className={`p-2 rounded-lg ${feature.color} flex-shrink-0`}>
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                    Actif
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                💡 Conseil d'utilisation
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Pour une expérience optimale, installez l'application sur votre appareil. 
                Cliquez sur l'icône d'installation dans votre navigateur ou utilisez le menu "Ajouter à l'écran d'accueil".
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  📱 Mobile
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  💻 Desktop
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  🌐 Cross-platform
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

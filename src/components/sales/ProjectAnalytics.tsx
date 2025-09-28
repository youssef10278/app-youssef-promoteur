import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Car,
  AlertTriangle,
  Calendar,
  PieChart,
  Target,
  Wallet,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AnalyticsService, ProjectAnalytics } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

interface ProjectAnalyticsProps {
  projectId: string;
  projectName: string;
}

export const ProjectAnalyticsComponent: React.FC<ProjectAnalyticsProps> = ({ 
  projectId, 
  projectName 
}) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Charger les analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getProjectAnalytics(projectId);
        setAnalytics(data);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les analytics du projet.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadAnalytics();
    }
  }, [projectId, toast]);

  if (loading) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics du Projet - {projectName}
          </CardTitle>
          <CardDescription>Statistiques détaillées des ventes et encaissements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics du Projet - {projectName}
          </CardTitle>
          <CardDescription>Statistiques détaillées des ventes et encaissements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée d'analytics disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics du Projet - {projectName}
            </CardTitle>
            <CardDescription>Statistiques détaillées des ventes et encaissements</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Détails
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Vue résumée - toujours visible */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-blue-600 font-medium">Total Propriétés</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{analytics.total_proprietes}</p>
                </div>
                <Home className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-green-600 font-medium">Vendues</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">{analytics.proprietes_vendues}</p>
                  <p className="text-sm sm:text-base text-green-600">{analytics.taux_vente}%</p>
                </div>
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-orange-600 font-medium">CA Total</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-700">
                    {analytics.chiffre_affaires_total.toLocaleString()} DH
                  </p>
                </div>
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-purple-600 font-medium">Encaissé</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-700">
                    {analytics.montant_encaisse_total.toLocaleString()} DH
                  </p>
                  <p className="text-sm sm:text-base text-purple-600">{analytics.progression_encaissement}%</p>
                </div>
                <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Détails complets - conditionnellement visible */}
        {isExpanded && (
          <>
        {/* Statistiques des propriétés */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            État des Propriétés
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{analytics.total_proprietes}</p>
                </div>
                <Home className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Vendues</p>
                  <p className="text-2xl font-bold text-green-700">{analytics.proprietes_vendues}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Restantes</p>
                  <p className="text-2xl font-bold text-orange-700">{analytics.proprietes_restantes}</p>
                </div>
                <Home className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Taux de Vente</p>
                  <p className="text-2xl font-bold text-purple-700">{analytics.taux_vente}%</p>
                </div>
                <PieChart className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Détails par type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Appartements
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{analytics.appartements.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendus:</span>
                  <span className="font-medium text-green-600">{analytics.appartements.vendus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restants:</span>
                  <span className="font-medium text-orange-600">{analytics.appartements.restants}</span>
                </div>
                <div className="flex justify-between">
                  <span>CA Total:</span>
                  <span className="font-medium">{analytics.appartements.ca_total.toLocaleString()} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>CA Encaissé:</span>
                  <span className="font-medium text-green-600">{analytics.appartements.ca_encaisse.toLocaleString()} DH</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center">
                <Car className="h-4 w-4 mr-2" />
                Garages
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{analytics.garages.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendus:</span>
                  <span className="font-medium text-green-600">{analytics.garages.vendus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restants:</span>
                  <span className="font-medium text-orange-600">{analytics.garages.restants}</span>
                </div>
                <div className="flex justify-between">
                  <span>CA Total:</span>
                  <span className="font-medium">{analytics.garages.ca_total.toLocaleString()} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>CA Encaissé:</span>
                  <span className="font-medium text-green-600">{analytics.garages.ca_encaisse.toLocaleString()} DH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques financières */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Finances Globales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">CA Total</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {analytics.chiffre_affaires_total.toLocaleString()} DH
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Encaissé</p>
                  <p className="text-xl font-bold text-green-700">
                    {analytics.montant_encaisse_total.toLocaleString()} DH
                  </p>
                </div>
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Restant</p>
                  <p className="text-xl font-bold text-red-700">
                    {analytics.montant_restant_total.toLocaleString()} DH
                  </p>
                </div>
                <CreditCard className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          {/* Progression d'encaissement */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression d'Encaissement</span>
              <span className="text-sm font-bold">{analytics.progression_encaissement}%</span>
            </div>
            <Progress value={analytics.progression_encaissement} className="h-3" />
          </div>
        </div>

        {/* Montants principal vs autre montant */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Répartition Fiscale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Montant Principal</p>
                  <p className="text-xl font-bold text-blue-700">
                    {analytics.montant_declare_total.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-blue-600">{analytics.pourcentage_declare}% du total</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Principal
                </Badge>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Autre Montant</p>
                  <p className="text-xl font-bold text-amber-700">
                    {analytics.montant_non_declare_total.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-amber-600">{analytics.pourcentage_non_declare}% du total</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Autre Montant
                </Badge>
              </div>
            </div>
          </div>

          {/* Barres de progression pour la répartition */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-600">Principal</span>
                <span className="text-sm font-bold text-blue-600">{analytics.pourcentage_declare}%</span>
              </div>
              <Progress value={analytics.pourcentage_declare} className="h-2 bg-blue-100" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-amber-600">Autre Montant</span>
                <span className="text-sm font-bold text-amber-600">{analytics.pourcentage_non_declare}%</span>
              </div>
              <Progress value={analytics.pourcentage_non_declare} className="h-2 bg-amber-100" />
            </div>
          </div>
        </div>

        {/* Échéances et alertes */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Échéances et Alertes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">En Retard</p>
                  <p className="text-2xl font-bold text-red-700">{analytics.echeances_en_retard}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Cette Semaine</p>
                  <p className="text-2xl font-bold text-orange-700">{analytics.echeances_cette_semaine}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-600 font-medium">Prochaine Échéance</p>
                  <p className="text-lg font-bold text-teal-700">
                    {analytics.prochaine_echeance_montant.toLocaleString()} DH
                  </p>
                  {analytics.prochaine_echeance_date && (
                    <p className="text-xs text-teal-600">
                      {new Date(analytics.prochaine_echeance_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Calendar className="h-8 w-8 text-teal-500" />
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
};

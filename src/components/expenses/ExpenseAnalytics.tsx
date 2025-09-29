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
  Receipt,
  CreditCard,
  Wallet,
  PieChart,
  Target,
  Calendar,
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExpenseAnalyticsService, ExpenseAnalytics } from '@/services/expenseAnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface ExpenseAnalyticsProps {
  projectId?: string;
  projectName?: string;
  showAllProjects?: boolean;
}

export const ExpenseAnalyticsComponent: React.FC<ExpenseAnalyticsProps> = ({ 
  projectId, 
  projectName,
  showAllProjects = false
}) => {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Charger les analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        let data: ExpenseAnalytics;
        
        // Utiliser la route appropriée selon le contexte
        if (projectId && !showAllProjects) {
          // Récupérer les analytics pour un projet spécifique
          data = await ExpenseAnalyticsService.getProjectExpenseAnalytics(projectId);
        } else {
          // Récupérer toutes les analytics
          data = await ExpenseAnalyticsService.getAllExpenseAnalytics();
        }
        
        setAnalytics(data);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics de dépenses:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les analytics des dépenses.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [projectId, showAllProjects, toast]);

  if (loading) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics des Dépenses{projectName ? ` - ${projectName}` : ''}
          </CardTitle>
          <CardDescription>Statistiques détaillées des dépenses et répartitions</CardDescription>
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
            Analytics des Dépenses{projectName ? ` - ${projectName}` : ''}
          </CardTitle>
          <CardDescription>Statistiques détaillées des dépenses et répartitions</CardDescription>
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
              Analytics des Dépenses{projectName ? ` - ${projectName}` : ''}
            </CardTitle>
            <CardDescription>Statistiques détaillées des dépenses et répartitions</CardDescription>
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
                  <p className="text-sm sm:text-base text-blue-600 font-medium">Total Dépenses</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{analytics.total_depenses}</p>
                </div>
                <Receipt className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-red-600 font-medium">Montant Total</p>
                  <p className="text-lg sm:text-xl font-bold text-red-700">
                    {analytics.montant_total_depenses.toLocaleString()} DH
                  </p>
                </div>
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-green-600 font-medium">Principal</p>
                  <p className="text-lg sm:text-xl font-bold text-green-700">
                    {analytics.montant_declare_total.toLocaleString()} DH
                  </p>
                  <p className="text-sm sm:text-base text-green-600">{analytics.pourcentage_declare}%</p>
                </div>
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-amber-600 font-medium">Autre Montant</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-700">
                    {analytics.montant_non_declare_total.toLocaleString()} DH
                  </p>
                  <p className="text-sm sm:text-base text-amber-600">{analytics.pourcentage_non_declare}%</p>
                </div>
                <PieChart className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Détails complets - conditionnellement visible */}
        {isExpanded && (
          <>
        {/* Statistiques générales */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Vue d'Ensemble
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Dépenses</p>
                  <p className="text-2xl font-bold text-blue-700">{analytics.total_depenses}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Montant Total</p>
                  <p className="text-2xl font-bold text-red-700">
                    {analytics.montant_total_depenses.toLocaleString()} DH
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Moyenne/Dépense</p>
                  <p className="text-2xl font-bold text-green-700">
                    {analytics.montant_moyen_par_depense.toLocaleString()} DH
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Ce Mois</p>
                  <p className="text-2xl font-bold text-purple-700">{analytics.depenses_ce_mois}</p>
                  <p className="text-xs text-purple-600">
                    {analytics.montant_ce_mois.toLocaleString()} DH
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Répartition fiscale */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Répartition Fiscale
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                  <p className="text-sm text-amber-600 font-medium">Autre montant</p>
                  <p className="text-xl font-bold text-amber-700">
                    {analytics.montant_non_declare_total.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-amber-600">{analytics.pourcentage_non_declare}% du total</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Autre montant
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

        {/* Modes de paiement */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Répartition par Mode de Paiement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Espèces</p>
                  <p className="text-lg font-bold text-green-700">{analytics.modes_paiement.espece.nombre}</p>
                  <p className="text-xs text-green-600">
                    {analytics.modes_paiement.espece.montant.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-green-600">{analytics.modes_paiement.espece.pourcentage}%</p>
                </div>
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Chèques</p>
                  <p className="text-lg font-bold text-blue-700">{analytics.modes_paiement.cheque.nombre}</p>
                  <p className="text-xs text-blue-600">
                    {analytics.modes_paiement.cheque.montant.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-blue-600">{analytics.modes_paiement.cheque.pourcentage}%</p>
                </div>
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Mixte</p>
                  <p className="text-lg font-bold text-purple-700">{analytics.modes_paiement.cheque_espece.nombre}</p>
                  <p className="text-xs text-purple-600">
                    {analytics.modes_paiement.cheque_espece.montant.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-purple-600">{analytics.modes_paiement.cheque_espece.pourcentage}%</p>
                </div>
                <Receipt className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Virements</p>
                  <p className="text-lg font-bold text-indigo-700">{analytics.modes_paiement.virement.nombre}</p>
                  <p className="text-xs text-indigo-600">
                    {analytics.modes_paiement.virement.montant.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-indigo-600">{analytics.modes_paiement.virement.pourcentage}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par projet (si analytics globales) */}
        {showAllProjects && analytics.par_projet.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Répartition par Projet
            </h3>
            <div className="space-y-3">
              {analytics.par_projet.slice(0, 5).map((projet, index) => (
                <div key={projet.project_id} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{projet.project_nom}</h4>
                      <p className="text-sm text-muted-foreground">
                        {projet.nombre_depenses} dépense(s) • {projet.montant_total.toLocaleString()} DH
                      </p>
                    </div>
                    <Badge variant="outline">
                      {projet.pourcentage_du_total}%
                    </Badge>
                  </div>
                  <Progress value={projet.pourcentage_du_total} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Principal: {projet.montant_declare.toLocaleString()} DH</span>
                    <span>Autre montant: {projet.montant_non_declare.toLocaleString()} DH</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques temporelles */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Statistiques Temporelles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Ce Mois</p>
                  <p className="text-xl font-bold text-orange-700">{analytics.depenses_ce_mois} dépenses</p>
                  <p className="text-sm text-orange-600">
                    {analytics.montant_ce_mois.toLocaleString()} DH
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-600 font-medium">Cette Année</p>
                  <p className="text-xl font-bold text-teal-700">{analytics.depenses_cette_annee} dépenses</p>
                  <p className="text-sm text-teal-600">
                    {analytics.montant_cette_annee.toLocaleString()} DH
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-teal-500" />
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

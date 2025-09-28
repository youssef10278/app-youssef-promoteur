import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BarChart3, Home, Calculator } from 'lucide-react';
import { ProjectService } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

interface ProjectStatsProps {
  refreshTrigger?: number;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSurface: 0,
    totalLots: 0,
    averageSurface: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjectStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques des projets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Statistiques des Projets
          </CardTitle>
          <CardDescription>Vue d'ensemble de votre portefeuille immobilier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-premium mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Statistiques des Projets
        </CardTitle>
        <CardDescription>Vue d'ensemble de votre portefeuille immobilier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projets */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-blue-600 font-medium">Total Projets</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.totalProjects}</p>
              </div>
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Surface Totale */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-green-600 font-medium">Surface Totale</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">
                  {stats.totalSurface.toLocaleString()} m²
                </p>
              </div>
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Total Lots */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-orange-600 font-medium">Total Lots</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-700">{stats.totalLots}</p>
              </div>
              <Home className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Surface Moyenne */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-purple-600 font-medium">Surface Moyenne</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {Math.round(stats.averageSurface).toLocaleString()} m²
                </p>
              </div>
              <Calculator className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

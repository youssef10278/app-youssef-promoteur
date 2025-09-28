import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Edit, Trash2, Home, Car, Calendar, Users } from 'lucide-react';
import { Project } from '@/services/projectService';

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  isLoading,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <Card className="card-premium text-center py-12">
        <CardContent>
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p>Chargement des projets...</p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="card-premium text-center py-12">
        <CardContent>
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
          <p className="text-muted-foreground mb-6">
            Aucun projet ne correspond à vos critères de recherche
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="card-premium hover-lift">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg mb-2 truncate">
                  {project.nom}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{project.localisation}</span>
                </CardDescription>
              </div>
              
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Société */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Société:</span>
              <span className="font-medium truncate">{project.societe}</span>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {project.surface_totale.toLocaleString()}
                </div>
                <div className="text-xs text-blue-700">m² total</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {project.nombre_lots}
                </div>
                <div className="text-xs text-green-700">lots</div>
              </div>
            </div>

            {/* Détails des unités */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Appart.:</span>
                <span className="font-medium">{project.nombre_appartements}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Garages:</span>
                <span className="font-medium">{project.nombre_garages}</span>
              </div>
            </div>

            {/* Date de création */}
            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Créé le:</span>
              <span className="font-medium">{formatDate(project.created_at)}</span>
            </div>

            {/* Badge de statut */}
            <div className="flex justify-center pt-2">
              <Badge variant="outline" className="text-xs">
                Projet actif
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

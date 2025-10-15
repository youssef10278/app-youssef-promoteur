import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
} from 'lucide-react';
import { ProjectFilters as ProjectFiltersType } from '@/services/projectService';

export interface ProjectFiltersState extends ProjectFiltersType {}

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onFiltersChange: (filters: ProjectFiltersState) => void;
  totalResults: number;
  isLoading: boolean;
}

const SORT_OPTIONS = [
  { value: 'date', label: 'Date de création' },
  { value: 'nom', label: 'Nom du projet' },
  { value: 'localisation', label: 'Localisation' },
  { value: 'societe', label: 'Société' },
  { value: 'surface', label: 'Surface totale' },
  { value: 'lots', label: 'Nombre de lots' },
];

export const ProjectFiltersComponent: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  totalResults,
  isLoading
}) => {
  const [localFilters, setLocalFilters] = useState<ProjectFiltersState>(filters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Synchroniser les filtres locaux avec les filtres externes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounce pour la recherche avec comparaison pour éviter les appels inutiles
  useEffect(() => {
    const timer = setTimeout(() => {
      // Vérifier si les filtres ont vraiment changé
      const hasChanged = JSON.stringify(localFilters) !== JSON.stringify(filters);
      if (hasChanged) {
        console.log('🔍 Filtres changés, mise à jour:', localFilters);
        onFiltersChange(localFilters);
      }
    }, 500); // Augmenter le délai pour réduire les requêtes

    return () => clearTimeout(timer);
  }, [localFilters, onFiltersChange, filters]);

  const updateFilter = (key: keyof ProjectFiltersState, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSortOrder = () => {
    updateFilter('sortOrder', localFilters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    const defaultFilters: ProjectFiltersState = {
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'desc',
      minSurface: undefined,
      maxSurface: undefined,
      minLots: undefined,
      maxLots: undefined,
    };
    setLocalFilters(defaultFilters);
    setShowAdvancedFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.minSurface) count++;
    if (localFilters.maxSurface) count++;
    if (localFilters.minLots) count++;
    if (localFilters.maxLots) count++;
    return count;
  };

  return (
    <Card className="card-premium mb-6">
      <CardContent className="p-6">
        {/* Ligne principale de recherche et tri */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, localisation, société..."
              value={localFilters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contrôles - Tri et Filtres */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            {/* Sélecteur de tri */}
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                className="flex-shrink-0"
              >
                {localFilters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              {/* Bouton filtres avancés */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>

              {/* Bouton reset */}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetFilters}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Surface minimale */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Surface min (m²)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={localFilters.minSurface || ''}
                  onChange={(e) => updateFilter('minSurface', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              {/* Surface maximale */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Surface max (m²)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={localFilters.maxSurface || ''}
                  onChange={(e) => updateFilter('maxSurface', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              {/* Lots minimum */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Lots min</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={localFilters.minLots || ''}
                  onChange={(e) => updateFilter('minLots', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              {/* Lots maximum */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Lots max</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={localFilters.maxLots || ''}
                  onChange={(e) => updateFilter('maxLots', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              "Recherche en cours..."
            ) : (
              `${totalResults} projet${totalResults !== 1 ? 's' : ''} trouvé${totalResults !== 1 ? 's' : ''}`
            )}
          </div>

          {/* Badges des filtres actifs */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-1">
              {localFilters.searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Recherche: {localFilters.searchTerm}
                </Badge>
              )}
              {localFilters.minSurface && (
                <Badge variant="secondary" className="text-xs">
                  Surface ≥ {localFilters.minSurface}m²
                </Badge>
              )}
              {localFilters.maxSurface && (
                <Badge variant="secondary" className="text-xs">
                  Surface ≤ {localFilters.maxSurface}m²
                </Badge>
              )}
              {localFilters.minLots && (
                <Badge variant="secondary" className="text-xs">
                  Lots ≥ {localFilters.minLots}
                </Badge>
              )}
              {localFilters.maxLots && (
                <Badge variant="secondary" className="text-xs">
                  Lots ≤ {localFilters.maxLots}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PropertyType, SaleStatus, PaymentMode } from '@/types/sale-new';

export interface SalesFiltersState {
  searchTerm: string;
  statut: SaleStatus | '';
  type_propriete: PropertyType | '';
  mode_paiement: PaymentMode | '';
  date_debut: Date | null;
  date_fin: Date | null;
  montant_min: number | null;
  montant_max: number | null;
  sortBy: 'created_at' | 'client_nom' | 'prix_total' | 'unite_numero' | 'progression';
  sortOrder: 'asc' | 'desc';
}

interface SalesFiltersProps {
  filters: SalesFiltersState;
  onFiltersChange: (filters: SalesFiltersState) => void;
  totalResults: number;
  isLoading?: boolean;
}

const INITIAL_FILTERS: SalesFiltersState = {
  searchTerm: '',
  statut: '',
  type_propriete: '',
  mode_paiement: '',
  date_debut: null,
  date_fin: null,
  montant_min: null,
  montant_max: null,
  sortBy: 'created_at',
  sortOrder: 'desc'
};

const STATUT_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' }
];

const TYPE_PROPRIETE_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'garage', label: 'Garage' }
];

const MODE_PAIEMENT_OPTIONS = [
  { value: 'espece', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'cheque_espece', label: 'Chèque et Espèces' },
  { value: 'virement', label: 'Virement' }
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date de création' },
  { value: 'client_nom', label: 'Nom du client' },
  { value: 'prix_total', label: 'Prix total' },
  { value: 'unite_numero', label: 'Numéro d\'unité' },
  { value: 'progression', label: 'Progression' }
];

export function SalesFilters({ filters, onFiltersChange, totalResults, isLoading }: SalesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Synchroniser les filtres temporaires avec les filtres externes
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof SalesFiltersState, value: any) => {
    const newFilters = { ...tempFilters, [key]: value };
    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    setTempFilters(INITIAL_FILTERS);
    onFiltersChange(INITIAL_FILTERS);
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm !== '' ||
      filters.statut !== '' ||
      filters.type_propriete !== '' ||
      filters.mode_paiement !== '' ||
      filters.date_debut !== null ||
      filters.date_fin !== null ||
      filters.montant_min !== null ||
      filters.montant_max !== null
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statut) count++;
    if (filters.type_propriete) count++;
    if (filters.mode_paiement) count++;
    if (filters.date_debut) count++;
    if (filters.date_fin) count++;
    if (filters.montant_min) count++;
    if (filters.montant_max) count++;
    return count;
  };

  return (
    <Card className="card-premium" data-testid="sales-filters">
      <CardContent className="p-4">
        {/* Barre de recherche principale et contrôles */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par nom client, unité, numéro de chèque..."
              value={tempFilters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>

          {/* Contrôles - Tri et Filtres */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            {/* Tri */}
            <div className="flex gap-2 flex-1">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex-shrink-0"
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              {/* Bouton filtres avancés */}
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative flex-1 sm:flex-initial"
                data-testid="filters-button"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {hasActiveFilters() && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>

              {/* Bouton reset */}
              {hasActiveFilters() && (
                <Button variant="ghost" size="icon" onClick={resetFilters} data-testid="reset-filters-button" className="flex-shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres avancés (repliables) */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statut */}
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select
                  value={filters.statut}
                  onValueChange={(value) => updateFilter('statut', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {STATUT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type de propriété */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type de propriété</label>
                <Select
                  value={filters.type_propriete}
                  onValueChange={(value) => updateFilter('type_propriete', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {TYPE_PROPRIETE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mode de paiement</label>
                <Select
                  value={filters.mode_paiement}
                  onValueChange={(value) => updateFilter('mode_paiement', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    {MODE_PAIEMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates et montants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date début */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.date_debut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.date_debut ? format(filters.date_debut, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.date_debut || undefined}
                      onSelect={(date) => updateFilter('date_debut', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date fin */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.date_fin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.date_fin ? format(filters.date_fin, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.date_fin || undefined}
                      onSelect={(date) => updateFilter('date_fin', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Montant minimum */}
              <div>
                <label className="text-sm font-medium mb-2 block">Montant min (DH)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.montant_min || ''}
                  onChange={(e) => updateFilter('montant_min', e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              {/* Montant maximum */}
              <div>
                <label className="text-sm font-medium mb-2 block">Montant max (DH)</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.montant_max || ''}
                  onChange={(e) => updateFilter('montant_max', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              "Recherche en cours..."
            ) : (
              `${totalResults} résultat${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`
            )}
          </div>

          {/* Filtres actifs */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2">
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: "{filters.searchTerm}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('searchTerm', '')}
                  />
                </Badge>
              )}
              {filters.statut && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Statut: {STATUT_OPTIONS.find(o => o.value === filters.statut)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('statut', '')}
                  />
                </Badge>
              )}
              {filters.type_propriete && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {TYPE_PROPRIETE_OPTIONS.find(o => o.value === filters.type_propriete)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('type_propriete', '')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

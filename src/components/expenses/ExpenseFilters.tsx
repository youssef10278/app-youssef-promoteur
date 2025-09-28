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
import { PaymentMode } from '@/types/expense';

export interface ExpenseFiltersState {
  searchTerm: string;
  mode_paiement: PaymentMode | '';
  date_debut: Date | null;
  date_fin: Date | null;
  montant_min: number | null;
  montant_max: number | null;
  sortBy: 'created_at' | 'nom' | 'montant_total' | 'montant_declare' | 'montant_non_declare';
  sortOrder: 'asc' | 'desc';
}

interface ExpenseFiltersProps {
  filters: ExpenseFiltersState;
  onFiltersChange: (filters: ExpenseFiltersState) => void;
  totalResults: number;
  isLoading?: boolean;
}

const INITIAL_FILTERS: ExpenseFiltersState = {
  searchTerm: '',
  mode_paiement: '',
  date_debut: null,
  date_fin: null,
  montant_min: null,
  montant_max: null,
  sortBy: 'created_at',
  sortOrder: 'desc'
};

const PAYMENT_MODE_LABELS = {
  espece: 'Espèces',
  cheque: 'Chèque',
  cheque_espece: 'Mixte (Chèque + Espèces)',
  virement: 'Virement'
};

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date de création' },
  { value: 'nom', label: 'Nom de la dépense' },
  { value: 'montant_total', label: 'Montant total' },
  { value: 'montant_declare', label: 'Montant principal' },
  { value: 'montant_non_declare', label: 'Autre montant' }
];

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  filters,
  onFiltersChange,
  totalResults,
  isLoading = false
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<ExpenseFiltersState>(filters);

  // Synchroniser les filtres locaux avec les props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Appliquer les filtres avec un délai pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localFilters, onFiltersChange]);

  const updateFilter = (key: keyof ExpenseFiltersState, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setLocalFilters(INITIAL_FILTERS);
    onFiltersChange(INITIAL_FILTERS);
  };

  const toggleSortOrder = () => {
    const newOrder = localFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilter('sortOrder', newOrder);
  };

  const hasActiveFilters = () => {
    return localFilters.searchTerm !== '' ||
           localFilters.mode_paiement !== '' ||
           localFilters.date_debut !== null ||
           localFilters.date_fin !== null ||
           localFilters.montant_min !== null ||
           localFilters.montant_max !== null;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.mode_paiement) count++;
    if (localFilters.date_debut) count++;
    if (localFilters.date_fin) count++;
    if (localFilters.montant_min) count++;
    if (localFilters.montant_max) count++;
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
              placeholder="Rechercher par nom de dépense, description, numéro de chèque..."
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
              {/* Mode de paiement */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mode de paiement</label>
                <Select
                  value={localFilters.mode_paiement}
                  onValueChange={(value) => updateFilter('mode_paiement', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date de début */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date de début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.date_debut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.date_debut ? (
                        format(localFilters.date_debut, "dd/MM/yyyy", { locale: fr })
                      ) : (
                        "Sélectionner"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.date_debut}
                      onSelect={(date) => updateFilter('date_debut', date)}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date de fin */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.date_fin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.date_fin ? (
                        format(localFilters.date_fin, "dd/MM/yyyy", { locale: fr })
                      ) : (
                        "Sélectionner"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.date_fin}
                      onSelect={(date) => updateFilter('date_fin', date)}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bouton reset */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters()}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Filtres de montant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Montant minimum (DH)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.montant_min || ''}
                  onChange={(e) => updateFilter('montant_min', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Montant maximum (DH)</label>
                <Input
                  type="number"
                  placeholder="Illimité"
                  value={localFilters.montant_max || ''}
                  onChange={(e) => updateFilter('montant_max', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Résultats et filtres actifs */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Recherche en cours...
              </div>
            ) : (
              <span>{totalResults} résultat{totalResults !== 1 ? 's' : ''} trouvé{totalResults !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Badges des filtres actifs */}
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 flex-wrap">
              {localFilters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: "{localFilters.searchTerm}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('searchTerm', '')}
                  />
                </Badge>
              )}
              {localFilters.mode_paiement && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {PAYMENT_MODE_LABELS[localFilters.mode_paiement]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('mode_paiement', '')}
                  />
                </Badge>
              )}
              {localFilters.date_debut && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Depuis: {format(localFilters.date_debut, "dd/MM/yyyy", { locale: fr })}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('date_debut', null)}
                  />
                </Badge>
              )}
              {localFilters.date_fin && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Jusqu'au: {format(localFilters.date_fin, "dd/MM/yyyy", { locale: fr })}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('date_fin', null)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

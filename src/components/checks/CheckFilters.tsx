import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface CheckFiltersState {
  searchTerm: string;
  type_cheque: 'recu' | 'donne' | 'all';
  date_debut: Date | null;
  date_fin: Date | null;
  montant_min: number | null;
  montant_max: number | null;
  statut: 'emis' | 'encaisse' | 'rejete' | 'all';
  nom_beneficiaire: string;
  nom_emetteur: string;
  numero_cheque: string;
  sortBy?: 'created_at' | 'montant' | 'date_emission' | 'numero_cheque';
  sortOrder?: 'asc' | 'desc';
}

interface CheckFiltersProps {
  filters: CheckFiltersState;
  onFiltersChange: (filters: CheckFiltersState) => void;
  resultCount: number;
}

const CHECK_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'recu', label: 'Chèques reçus' },
  { value: 'donne', label: 'Chèques donnés' }
];

const CHECK_STATUS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'emis', label: 'Émis' },
  { value: 'encaisse', label: 'Encaissé' },
  { value: 'rejete', label: 'Rejeté' }
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date de création' },
  { value: 'date_emission', label: 'Date d\'émission' },
  { value: 'montant', label: 'Montant' },
  { value: 'numero_cheque', label: 'Numéro de chèque' }
];

export const CheckFilters: React.FC<CheckFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount
}) => {
  const [searchValue, setSearchValue] = useState(filters.searchTerm);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: searchValue });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleFilterChange = (key: keyof CheckFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    const resetFilters: CheckFiltersState = {
      searchTerm: '',
      type_cheque: 'all',
      date_debut: null,
      date_fin: null,
      montant_min: null,
      montant_max: null,
      statut: 'all',
      nom_beneficiaire: '',
      nom_emetteur: '',
      numero_cheque: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setSearchValue('');
    onFiltersChange(resetFilters);
    setIsAdvancedOpen(false);
  };

  const removeFilter = (key: keyof CheckFiltersState) => {
    if (key === 'searchTerm') {
      setSearchValue('');
    }
    handleFilterChange(key, key === 'sortBy' ? 'created_at' : key === 'sortOrder' ? 'desc' : key.includes('date') ? null : key.includes('montant') ? null : key === 'type_cheque' ? 'all' : key === 'statut' ? 'all' : '');
  };

  const toggleSortOrder = () => {
    handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Compter les filtres actifs
  const activeFiltersCount = [
    filters.searchTerm,
    filters.type_cheque !== 'all' ? filters.type_cheque : null,
    filters.date_debut,
    filters.date_fin,
    filters.montant_min,
    filters.montant_max,
    filters.statut !== 'all' ? filters.statut : null,
    filters.nom_beneficiaire,
    filters.nom_emetteur,
    filters.numero_cheque
  ].filter(Boolean).length;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche et contrôles principaux */}
      <div className="flex gap-4 items-center">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro, bénéficiaire, émetteur, description..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={(value: any) => handleFilterChange('sortBy', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
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
            size="sm"
            onClick={toggleSortOrder}
            className="px-3"
          >
            {filters.sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Filtres avancés */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtres avancés</h4>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
              
              <Separator />

              {/* Type de chèque */}
              <div className="space-y-2">
                <Label>Type de chèque</Label>
                <Select value={filters.type_cheque} onValueChange={(value: any) => handleFilterChange('type_cheque', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={filters.statut} onValueChange={(value) => handleFilterChange('statut', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECK_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plage de dates */}
              <div className="space-y-2">
                <Label>Période d'émission</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Du</Label>
                    <Input
                      type="date"
                      value={formatDate(filters.date_debut)}
                      onChange={(e) => handleFilterChange('date_debut', parseDate(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Au</Label>
                    <Input
                      type="date"
                      value={formatDate(filters.date_fin)}
                      onChange={(e) => handleFilterChange('date_fin', parseDate(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Plage de montants */}
              <div className="space-y-2">
                <Label>Montant (DH)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.montant_min || ''}
                      onChange={(e) => handleFilterChange('montant_min', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={filters.montant_max || ''}
                      onChange={(e) => handleFilterChange('montant_max', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Badges des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Recherche: "{filters.searchTerm}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('searchTerm')} />
            </Badge>
          )}
          {filters.type_cheque && filters.type_cheque !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {CHECK_TYPES.find(t => t.value === filters.type_cheque)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('type_cheque')} />
            </Badge>
          )}
          {filters.statut && filters.statut !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Statut: {CHECK_STATUS.find(s => s.value === filters.statut)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('statut')} />
            </Badge>
          )}
          {filters.date_debut && (
            <Badge variant="secondary" className="gap-1">
              Du: {filters.date_debut.toLocaleDateString('fr-FR')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('date_debut')} />
            </Badge>
          )}
          {filters.date_fin && (
            <Badge variant="secondary" className="gap-1">
              Au: {filters.date_fin.toLocaleDateString('fr-FR')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('date_fin')} />
            </Badge>
          )}
          {filters.montant_min !== null && (
            <Badge variant="secondary" className="gap-1">
              Min: {filters.montant_min} DH
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('montant_min')} />
            </Badge>
          )}
          {filters.montant_max !== null && (
            <Badge variant="secondary" className="gap-1">
              Max: {filters.montant_max} DH
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('montant_max')} />
            </Badge>
          )}
        </div>
      )}

      {/* Compteur de résultats */}
      <div className="text-sm text-muted-foreground">
        {resultCount} résultat{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FilterOption {
  key: string;
  label: string;
  value: string;
}

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projects: Array<{ id: string; nom: string }>;
  selectedProject: string;
  onProjectChange: (project: string) => void;
  activeFilters: FilterOption[];
  onFilterAdd: (filter: FilterOption) => void;
  onFilterRemove: (filterKey: string) => void;
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  additionalFilters?: React.ReactNode;
}

export const SearchFilters = ({
  searchQuery,
  onSearchChange,
  projects,
  selectedProject,
  onProjectChange,
  activeFilters,
  onFilterAdd,
  onFilterRemove,
  dateRange,
  onDateRangeChange,
  additionalFilters
}: SearchFiltersProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, description, montant..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={selectedProject} onValueChange={onProjectChange}>
          <SelectTrigger className="w-auto min-w-[200px]">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.nom}>
                {project.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: fr })} -{" "}
                      {format(dateRange.to, "dd MMM", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM", { locale: fr })
                  )
                ) : (
                  "Période"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="h-10"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres avancés
        </Button>

        {additionalFilters}
      </div>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="secondary" 
              className="pr-1"
            >
              {filter.label}: {filter.value}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onFilterRemove(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => activeFilters.forEach(filter => onFilterRemove(filter.key))}
            className="text-muted-foreground hover:text-foreground"
          >
            Effacer tout
          </Button>
        </div>
      )}

      {/* Filtres avancés */}
      {isFilterOpen && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <h4 className="font-medium">Filtres avancés</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Les filtres spécifiques seront ajoutés ici selon le contexte */}
          </div>
        </div>
      )}
    </div>
  );
};
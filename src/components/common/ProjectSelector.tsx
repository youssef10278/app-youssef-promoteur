import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Project {
  id: string;
  nom: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectChange,
  placeholder = "Sélectionner un projet",
  showAllOption = true,
  allOptionLabel = "Tous les projets",
  className = "w-[300px]"
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filtrer les projets selon la recherche
  const filteredProjects = useMemo(() => {
    if (!searchValue) return projects;
    return projects.filter(project =>
      project.nom.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [projects, searchValue]);

  // Obtenir le nom du projet sélectionné
  const selectedProjectName = useMemo(() => {
    if (selectedProject === 'all') return allOptionLabel;
    const project = projects.find(p => p.id === selectedProject);
    return project?.nom || placeholder;
  }, [selectedProject, projects, allOptionLabel, placeholder]);

  const handleSelect = (value: string) => {
    onProjectChange(value);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{selectedProjectName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", className)} align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p>Aucun projet trouvé</p>
                {searchValue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez un autre terme de recherche
                  </p>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {showAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => handleSelect('all')}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProject === 'all' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Building2 className="h-4 w-4" />
                  <span>{allOptionLabel}</span>
                </CommandItem>
              )}
              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => handleSelect(project.id)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProject === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{project.nom}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

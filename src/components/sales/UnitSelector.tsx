import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Car } from 'lucide-react';
import { PropertyType } from '@/types/sale-new';

interface Unit {
  numero: string;
  surface?: number;
  disponible: boolean;
}

interface UnitSelectorProps {
  projectId: string;
  selectedType: PropertyType | '';
  onTypeChange: (type: PropertyType) => void;
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
  availableUnits: Record<PropertyType, Unit[]>;
}

const PROPERTY_TYPE_CONFIG = {
  appartement: {
    label: 'Appartements',
    icon: Building2,
    color: 'bg-blue-500',
    prefix: 'A'
  },
  garage: {
    label: 'Garages',
    icon: Car,
    color: 'bg-green-500',
    prefix: 'G'
  }
} as const;

export function UnitSelector({
  selectedType,
  onTypeChange,
  selectedUnit,
  onUnitChange,
  availableUnits
}: UnitSelectorProps) {
  const typeConfig = selectedType ? PROPERTY_TYPE_CONFIG[selectedType] : null;
  const units = selectedType ? availableUnits[selectedType] || [] : [];

  return (
    <div className="space-y-6">
      {/* Sélection du type de propriété */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type de propriété *</label>
        <Select
          value={selectedType}
          onValueChange={(value) => {
            onTypeChange(value as PropertyType);
            onUnitChange(''); // Reset unit selection when type changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type de propriété" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROPERTY_TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const availableCount = availableUnits[key as PropertyType]?.filter(u => u.disponible).length || 0;
              
              return (
                <SelectItem key={key} value={key} disabled={availableCount === 0}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                    <Badge variant={availableCount > 0 ? "default" : "secondary"} className="ml-auto">
                      {availableCount} disponible{availableCount > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Sélection de l'unité */}
      {selectedType && typeConfig && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <typeConfig.icon className="h-5 w-5" />
              <span>Unités Disponibles - {typeConfig.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <typeConfig.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune unité de ce type définie dans le projet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {units.map((unit) => (
                  <Button
                    key={unit.numero}
                    variant={selectedUnit === unit.numero ? "default" : "outline"}
                    className={`h-auto p-3 flex flex-col items-center space-y-1 ${
                      !unit.disponible 
                        ? 'opacity-50 cursor-not-allowed' 
                        : selectedUnit === unit.numero 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-muted'
                    }`}
                    disabled={!unit.disponible}
                    onClick={() => unit.disponible && onUnitChange(unit.numero)}
                  >
                    <div className={`w-8 h-8 rounded-full ${typeConfig.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {typeConfig.prefix}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{unit.numero}</div>
                      {unit.surface && (
                        <div className="text-xs text-muted-foreground">{unit.surface}m²</div>
                      )}
                    </div>
                    {!unit.disponible && (
                      <Badge variant="destructive" className="text-xs">
                        Vendu
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
            
            {selectedUnit && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full ${typeConfig.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {typeConfig.prefix}
                  </div>
                  <span className="font-medium">Unité sélectionnée : {selectedUnit}</span>
                  {units.find(u => u.numero === selectedUnit)?.surface && (
                    <Badge variant="outline">
                      {units.find(u => u.numero === selectedUnit)?.surface}m²
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

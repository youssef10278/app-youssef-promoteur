import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, FileText } from 'lucide-react';

interface PriceData {
  surface: number;
  prix_total: number;
  description: string;
}

interface PriceConfigFormProps {
  priceData: PriceData;
  onPriceDataChange: (data: PriceData) => void;
  selectedUnit: string;
  errors?: Record<string, string>;
}

export function PriceConfigForm({ 
  priceData, 
  onPriceDataChange, 
  selectedUnit,
  errors = {} 
}: PriceConfigFormProps) {
  const handleChange = (field: keyof PriceData, value: string | number) => {
    onPriceDataChange({
      ...priceData,
      [field]: value
    });
  };

  const prixParM2 = priceData.surface > 0 ? priceData.prix_total / priceData.surface : 0;

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Prix et Conditions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unité sélectionnée */}
        {selectedUnit && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-primary/20">
                Unité : {selectedUnit}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Surface */}
          <div className="space-y-2">
            <Label htmlFor="surface" className="flex items-center space-x-1">
              <Calculator className="h-4 w-4" />
              <span>Surface (m²) *</span>
            </Label>
            <Input
              id="surface"
              type="number"
              step="0.01"
              min="0"
              value={priceData.surface || ''}
              onChange={(e) => handleChange('surface', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 85.50"
              className={errors.surface ? 'border-destructive' : ''}
              required
            />
            {errors.surface && (
              <p className="text-sm text-destructive">{errors.surface}</p>
            )}
          </div>

          {/* Prix total */}
          <div className="space-y-2">
            <Label htmlFor="prix_total" className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>Prix total (DH) *</span>
            </Label>
            <Input
              id="prix_total"
              type="number"
              step="0.01"
              min="0"
              value={priceData.prix_total || ''}
              onChange={(e) => handleChange('prix_total', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 850000"
              className={errors.prix_total ? 'border-destructive' : ''}
              required
            />
            {errors.prix_total && (
              <p className="text-sm text-destructive">{errors.prix_total}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>Description *</span>
          </Label>
          <Textarea
            id="description"
            value={priceData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Ex: Appartement 3 pièces au 2ème étage avec balcon"
            className={errors.description ? 'border-destructive' : ''}
            rows={3}
            required
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Calculs automatiques */}
        {priceData.surface > 0 && priceData.prix_total > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Calculs Automatiques</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">Surface</div>
                <div className="font-medium">{priceData.surface.toLocaleString()} m²</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Prix total</div>
                <div className="font-medium text-primary">{priceData.prix_total.toLocaleString()} DH</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Prix par m²</div>
                <div className="font-medium text-success">{prixParM2.toLocaleString()} DH/m²</div>
              </div>
            </div>
          </div>
        )}

        {/* Résumé de la vente */}
        {selectedUnit && priceData.description && priceData.prix_total > 0 && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-primary">Résumé de la Vente</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unité :</span>
                <span className="font-medium">{selectedUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description :</span>
                <span className="font-medium text-right max-w-[200px]">{priceData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surface :</span>
                <span className="font-medium">{priceData.surface} m²</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Prix total :</span>
                <span className="font-bold text-primary">{priceData.prix_total.toLocaleString()} DH</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

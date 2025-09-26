import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote } from 'lucide-react';

interface CashFormProps {
  montantEspece: number;
  onMontantEspeceChange: (amount: number) => void;
  isReadOnly?: boolean;
}

const CashForm: React.FC<CashFormProps> = ({
  montantEspece,
  onMontantEspeceChange,
  isReadOnly = false,
}) => {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Banknote className="h-5 w-5 text-success" />
          <span>Paiement en Espèces</span>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Liquide
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="montant_espece">Montant en espèces (DH) *</Label>
          <Input
            id="montant_espece"
            type="number"
            step="0.01"
            min="0"
            value={montantEspece || ''}
            onChange={(e) => onMontantEspeceChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
            readOnly={isReadOnly}
            className={isReadOnly ? "bg-muted" : ""}
          />
          <p className="text-sm text-muted-foreground">
            Montant payé en liquide pour cette dépense
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashForm;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, FileCheck } from 'lucide-react';
import { CheckData } from '@/types/expense';

interface CheckFormProps {
  cheques: CheckData[];
  onChequesChange: (cheques: CheckData[]) => void;
  totalChequeAmount: number;
  onTotalChequeAmountChange: (amount: number) => void;
}

const CheckForm: React.FC<CheckFormProps> = ({
  cheques,
  onChequesChange,
  totalChequeAmount,
  onTotalChequeAmountChange,
}) => {
  const addCheque = () => {
    const newCheque: CheckData = {
      numero_cheque: '',
      nom_beneficiaire: '',
      nom_emetteur: '',
      date_emission: new Date().toISOString().split('T')[0],
      date_encaissement: '',
      montant: 0,
      description: '',
      statut: 'emis',
    };
    onChequesChange([...cheques, newCheque]);
  };

  const removeCheque = (index: number) => {
    const updatedCheques = cheques.filter((_, i) => i !== index);
    onChequesChange(updatedCheques);
    
    // Recalculate total
    console.log('🔍 [CheckForm DEBUG] Recalcul après suppression:', updatedCheques);
    const newTotal = updatedCheques.reduce((sum, cheque) => {
      const montant = Number(cheque.montant) || 0;
      console.log(`🔍 [CheckForm DEBUG] sum=${sum}, montant=${montant}, type=${typeof cheque.montant}`);
      return sum + montant;
    }, 0);
    console.log('🔍 [CheckForm DEBUG] Nouveau total après suppression:', newTotal);
    onTotalChequeAmountChange(newTotal);
  };

  const updateCheque = (index: number, field: keyof CheckData, value: string | number) => {
    const updatedCheques = cheques.map((cheque, i) => {
      if (i === index) {
        // ✅ CORRECTION : Forcer la conversion en number pour le montant
        const finalValue = field === 'montant' ? Number(value) || 0 : value;
        return { ...cheque, [field]: finalValue };
      }
      return cheque;
    });
    onChequesChange(updatedCheques);

    // Recalculate total if amount changed
    if (field === 'montant') {
      console.log('🔍 [CheckForm DEBUG] Recalcul après modification montant:', updatedCheques);
      const newTotal = updatedCheques.reduce((sum, cheque) => {
        const montant = Number(cheque.montant) || 0;
        console.log(`🔍 [CheckForm DEBUG] sum=${sum}, montant=${montant}, type=${typeof cheque.montant}, raw=${cheque.montant}`);
        return sum + montant;
      }, 0);
      console.log('🔍 [CheckForm DEBUG] Nouveau total après modification:', newTotal);
      onTotalChequeAmountChange(newTotal);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Chèques</h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {cheques.length} chèque{cheques.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <Button
          type="button"
          onClick={addCheque}
          size="sm"
          className="btn-premium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter Chèque
        </Button>
      </div>

      {cheques.length === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun chèque ajouté
            </p>
            <p className="text-sm text-muted-foreground/70 text-center mt-1">
              Cliquez sur "Ajouter Chèque" pour commencer
            </p>
          </CardContent>
        </Card>
      )}

      {cheques.map((cheque, index) => (
        <Card key={cheque.id || `cheque-${index}`} className="card-premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <span>Chèque #{index + 1}</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Émis
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCheque(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`numero_cheque_${index}`}>Numéro de chèque *</Label>
                <Input
                  id={`numero_cheque_${index}`}
                  value={cheque.numero_cheque}
                  onChange={(e) => updateCheque(index, 'numero_cheque', e.target.value)}
                  placeholder="Ex: 1234567"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`montant_${index}`}>Montant (DH) *</Label>
                <Input
                  id={`montant_${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={cheque.montant || ''}
                  onChange={(e) => updateCheque(index, 'montant', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`nom_beneficiaire_${index}`}>Nom du bénéficiaire *</Label>
                <Input
                  id={`nom_beneficiaire_${index}`}
                  value={cheque.nom_beneficiaire}
                  onChange={(e) => updateCheque(index, 'nom_beneficiaire', e.target.value)}
                  placeholder="À l'ordre de..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`nom_emetteur_${index}`}>Nom de l'émetteur *</Label>
                <Input
                  id={`nom_emetteur_${index}`}
                  value={cheque.nom_emetteur}
                  onChange={(e) => updateCheque(index, 'nom_emetteur', e.target.value)}
                  placeholder="Émis par..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`date_emission_${index}`}>Date d'émission *</Label>
                <Input
                  id={`date_emission_${index}`}
                  type="date"
                  value={cheque.date_emission}
                  onChange={(e) => updateCheque(index, 'date_emission', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`date_encaissement_${index}`}>Date d'encaissement prévue *</Label>
                <Input
                  id={`date_encaissement_${index}`}
                  type="date"
                  value={cheque.date_encaissement}
                  onChange={(e) => updateCheque(index, 'date_encaissement', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description_${index}`}>Description détaillée</Label>
              <Textarea
                id={`description_${index}`}
                value={cheque.description}
                onChange={(e) => updateCheque(index, 'description', e.target.value)}
                placeholder="Détails sur ce chèque..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {cheques.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total des chèques :</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-base px-3 py-1">
                {totalChequeAmount.toLocaleString()} DH
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckForm;
export { CheckForm };

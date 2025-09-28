import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CreditCard, Banknote, Building2, Plus, Trash2 } from 'lucide-react';
import { formatAmount } from '@/utils/payments';

interface Cheque {
  numero: string;
  banque: string;
  montant: number;
  date_echeance: string;
}

interface FirstPaymentData {
  montant: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_cheque?: number;
  montant_espece?: number;
  cheques?: Cheque[];
  reference_virement?: string;
  notes?: string;
}

interface FirstPaymentFormProps {
  data: FirstPaymentData;
  onChange: (data: FirstPaymentData) => void;
  prixTotal: number;
  errors?: Record<string, string>;
}

export function FirstPaymentForm({ data, onChange, prixTotal, errors = {} }: FirstPaymentFormProps) {
  const [showChequeDetails, setShowChequeDetails] = useState(false);

  const handleModeChange = (mode: FirstPaymentData['mode_paiement']) => {
    const newData = { ...data, mode_paiement: mode };
    
    if (mode === 'espece') {
      newData.montant_espece = data.montant;
      newData.montant_cheque = 0;
      newData.cheques = [];
    } else if (mode === 'cheque') {
      newData.montant_cheque = data.montant;
      newData.montant_espece = 0;
      newData.cheques = data.cheques || [];
    } else if (mode === 'cheque_espece') {
      newData.montant_cheque = data.montant_cheque || 0;
      newData.montant_espece = data.montant_espece || 0;
      newData.cheques = data.cheques || [];
    } else if (mode === 'virement') {
      newData.montant_cheque = 0;
      newData.montant_espece = 0;
      newData.cheques = [];
    }
    
    onChange(newData);
  };

  const addCheque = () => {
    const newCheque: Cheque = {
      numero: '',
      banque: '',
      montant: 0,
      date_echeance: data.date_paiement
    };
    
    onChange({
      ...data,
      cheques: [...(data.cheques || []), newCheque]
    });
    setShowChequeDetails(true);
  };

  const updateCheque = (index: number, field: keyof Cheque, value: string | number) => {
    const updatedCheques = [...(data.cheques || [])];
    updatedCheques[index] = { ...updatedCheques[index], [field]: value };
    
    onChange({
      ...data,
      cheques: updatedCheques
    });
  };

  const removeCheque = (index: number) => {
    const updatedCheques = data.cheques?.filter((_, i) => i !== index) || [];
    onChange({
      ...data,
      cheques: updatedCheques
    });
  };

  const pourcentagePaye = prixTotal > 0 ? (data.montant / prixTotal) * 100 : 0;
  const montantRestant = prixTotal - data.montant;

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Résumé du Premier Paiement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Prix total</Label>
              <p className="text-lg font-semibold">{formatAmount(prixTotal)} DH</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Premier paiement</Label>
              <p className="text-lg font-semibold text-green-600">{formatAmount(data.montant)} DH</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{pourcentagePaye.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(pourcentagePaye, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Montant restant</span>
              <span className="font-medium">{formatAmount(montantRestant)} DH</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails du paiement */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Détails du Premier Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Montant et date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant du paiement *</Label>
              <Input
                id="montant"
                type="number"
                value={data.montant || ''}
                onChange={(e) => {
                  const newMontant = parseFloat(e.target.value) || 0;
                  onChange({
                    ...data,
                    montant: newMontant,
                    // Auto-ajuster les montants principal/autre si pas encore définis
                    montant_declare: data.montant_declare || newMontant,
                    montant_non_declare: data.montant_non_declare || 0
                  });
                }}
                placeholder="0"
                className={errors.montant ? 'border-red-500' : ''}
              />
              {errors.montant && <p className="text-sm text-red-500">{errors.montant}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date du paiement *</Label>
              <Input
                id="date_paiement"
                type="date"
                value={data.date_paiement}
                onChange={(e) => onChange({ ...data, date_paiement: e.target.value })}
                className={errors.date_paiement ? 'border-red-500' : ''}
              />
              {errors.date_paiement && <p className="text-sm text-red-500">{errors.date_paiement}</p>}
            </div>
          </div>

          {/* Montants principal et autre */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="montant_declare" className="text-blue-700 font-medium">
                Montant principal *
              </Label>
              <Input
                id="montant_declare"
                type="number"
                value={data.montant_declare || ''}
                onChange={(e) => {
                  const declare = parseFloat(e.target.value) || 0;
                  onChange({
                    ...data,
                    montant_declare: declare,
                    montant_non_declare: Math.max(0, data.montant - declare)
                  });
                }}
                placeholder="0"
                className="border-blue-300 focus:border-blue-500"
              />
              <p className="text-xs text-blue-600">Montant principal du paiement</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant_non_declare" className="text-orange-700 font-medium">
                Autre montant
              </Label>
              <Input
                id="montant_non_declare"
                type="number"
                value={data.montant_non_declare || ''}
                onChange={(e) => {
                  const nonDeclare = parseFloat(e.target.value) || 0;
                  onChange({
                    ...data,
                    montant_non_declare: nonDeclare,
                    montant_declare: Math.max(0, data.montant - nonDeclare)
                  });
                }}
                placeholder="0"
                className="border-orange-300 focus:border-orange-500"
              />
              <p className="text-xs text-orange-600">Autre montant</p>
            </div>
          </div>

          {/* Validation des montants */}
          {(data.montant_declare + data.montant_non_declare) !== data.montant && data.montant > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ La somme des montants déclaré et non déclaré ({formatAmount(data.montant_declare + data.montant_non_declare)} DH)
                doit être égale au montant total ({formatAmount(data.montant)} DH)
              </p>
            </div>
          )}

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label>Mode de paiement *</Label>
            <Select value={data.mode_paiement} onValueChange={handleModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="espece">
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4" />
                    <span>Espèces</span>
                  </div>
                </SelectItem>
                <SelectItem value="cheque">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Chèque</span>
                  </div>
                </SelectItem>
                <SelectItem value="cheque_espece">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <Banknote className="h-4 w-4" />
                    <span>Chèque + Espèces</span>
                  </div>
                </SelectItem>
                <SelectItem value="virement">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Virement bancaire</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Détails selon le mode de paiement */}
          {data.mode_paiement === 'cheque_espece' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="montant_espece">Montant espèces</Label>
                <Input
                  id="montant_espece"
                  type="number"
                  value={data.montant_espece || ''}
                  onChange={(e) => onChange({ 
                    ...data, 
                    montant_espece: parseFloat(e.target.value) || 0,
                    montant_cheque: data.montant - (parseFloat(e.target.value) || 0)
                  })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant_cheque">Montant chèques</Label>
                <Input
                  id="montant_cheque"
                  type="number"
                  value={data.montant_cheque || ''}
                  onChange={(e) => onChange({ 
                    ...data, 
                    montant_cheque: parseFloat(e.target.value) || 0,
                    montant_espece: data.montant - (parseFloat(e.target.value) || 0)
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {data.mode_paiement === 'virement' && (
            <div className="space-y-2">
              <Label htmlFor="reference_virement">Référence du virement</Label>
              <Input
                id="reference_virement"
                value={data.reference_virement || ''}
                onChange={(e) => onChange({ ...data, reference_virement: e.target.value })}
                placeholder="Référence ou numéro de transaction"
              />
            </div>
          )}

          {/* Gestion des chèques */}
          {(data.mode_paiement === 'cheque' || data.mode_paiement === 'cheque_espece') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Chèques</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCheque}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un chèque
                </Button>
              </div>
              
              {data.cheques?.map((cheque, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Numéro du chèque</Label>
                      <Input
                        value={cheque.numero}
                        onChange={(e) => updateCheque(index, 'numero', e.target.value)}
                        placeholder="Numéro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Banque</Label>
                      <Input
                        value={cheque.banque}
                        onChange={(e) => updateCheque(index, 'banque', e.target.value)}
                        placeholder="Nom de la banque"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Montant</Label>
                      <Input
                        type="number"
                        value={cheque.montant || ''}
                        onChange={(e) => updateCheque(index, 'montant', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'échéance</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="date"
                          value={cheque.date_echeance}
                          onChange={(e) => updateCheque(index, 'date_echeance', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCheque(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
              placeholder="Notes sur ce paiement..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

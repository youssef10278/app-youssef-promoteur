import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PaymentScheduleItem {
  id: string;
  numero: number;
  date_echeance: string;
  montant: number;
  description: string;
}

interface PaymentScheduleFormProps {
  totalAmount: number;
  schedule: PaymentScheduleItem[];
  onScheduleChange: (schedule: PaymentScheduleItem[]) => void;
  errors?: Record<string, string>;
}

export function PaymentScheduleForm({ 
  totalAmount, 
  schedule, 
  onScheduleChange,
  errors = {} 
}: PaymentScheduleFormProps) {
  const [presetType, setPresetType] = useState<string>('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addPayment = () => {
    const newPayment: PaymentScheduleItem = {
      id: generateId(),
      numero: schedule.length + 1,
      date_echeance: format(new Date(), 'yyyy-MM-dd'),
      montant: 0,
      description: `Échéance ${schedule.length + 1}`
    };
    onScheduleChange([...schedule, newPayment]);
  };

  const removePayment = (id: string) => {
    const updatedSchedule = schedule
      .filter(item => item.id !== id)
      .map((item, index) => ({
        ...item,
        numero: index + 1,
        description: `Échéance ${index + 1}`
      }));
    onScheduleChange(updatedSchedule);
  };

  const updatePayment = (id: string, field: keyof PaymentScheduleItem, value: string | number) => {
    const updatedSchedule = schedule.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onScheduleChange(updatedSchedule);
  };

  const generatePresetSchedule = (type: string) => {
    if (!totalAmount || totalAmount <= 0) return;

    let newSchedule: PaymentScheduleItem[] = [];
    const today = new Date();

    switch (type) {
      case 'monthly_12':
        const monthlyAmount = totalAmount / 12;
        for (let i = 0; i < 12; i++) {
          newSchedule.push({
            id: generateId(),
            numero: i + 1,
            date_echeance: format(addMonths(today, i), 'yyyy-MM-dd'),
            montant: Math.round(monthlyAmount * 100) / 100,
            description: `Échéance ${i + 1}`
          });
        }
        break;

      case 'quarterly_4':
        const quarterlyAmount = totalAmount / 4;
        for (let i = 0; i < 4; i++) {
          newSchedule.push({
            id: generateId(),
            numero: i + 1,
            date_echeance: format(addMonths(today, i * 3), 'yyyy-MM-dd'),
            montant: Math.round(quarterlyAmount * 100) / 100,
            description: `Échéance ${i + 1}`
          });
        }
        break;

      case 'custom_3':
        // 30% - 30% - 40%
        const amounts = [0.3, 0.3, 0.4];
        for (let i = 0; i < 3; i++) {
          newSchedule.push({
            id: generateId(),
            numero: i + 1,
            date_echeance: format(addMonths(today, i * 2), 'yyyy-MM-dd'),
            montant: Math.round(totalAmount * amounts[i] * 100) / 100,
            description: `Échéance ${i + 1}`
          });
        }
        break;
    }

    onScheduleChange(newSchedule);
    setPresetType('');
  };

  const totalScheduled = schedule.reduce((sum, item) => sum + item.montant, 0);
  const difference = totalAmount - totalScheduled;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Plan d'Échéances</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modèles prédéfinis */}
        <div className="space-y-2">
          <Label>Modèles prédéfinis</Label>
          <div className="flex flex-wrap gap-2">
            <Select value={presetType} onValueChange={setPresetType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly_12">12 mensualités égales</SelectItem>
                <SelectItem value="quarterly_4">4 paiements trimestriels</SelectItem>
                <SelectItem value="custom_3">3 paiements (30%-30%-40%)</SelectItem>
              </SelectContent>
            </Select>
            {presetType && (
              <Button 
                variant="outline" 
                onClick={() => generatePresetSchedule(presetType)}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Appliquer</span>
              </Button>
            )}
          </div>
        </div>

        {/* Résumé financier */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Prix total</div>
              <div className="font-medium text-primary">{totalAmount.toLocaleString()} DH</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total planifié</div>
              <div className="font-medium">{totalScheduled.toLocaleString()} DH</div>
            </div>
            <div>
              <div className="text-muted-foreground">Différence</div>
              <div className={`font-medium ${isBalanced ? 'text-success' : 'text-destructive'}`}>
                {difference.toLocaleString()} DH
              </div>
            </div>
          </div>
          {!isBalanced && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Le total des échéances doit égaler le prix total</span>
            </div>
          )}
        </div>

        {/* Liste des échéances */}
        <div className="space-y-3">
          {schedule.map((payment, index) => (
            <div key={payment.id} className="p-3 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Échéance {payment.numero}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePayment(payment.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date d'échéance</Label>
                  <Input
                    type="date"
                    value={payment.date_echeance}
                    onChange={(e) => updatePayment(payment.id, 'date_echeance', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Montant (DH)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payment.montant || ''}
                    onChange={(e) => updatePayment(payment.id, 'montant', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={payment.description}
                  onChange={(e) => updatePayment(payment.id, 'description', e.target.value)}
                  placeholder="Description de l'échéance"
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bouton d'ajout */}
        <Button
          variant="outline"
          onClick={addPayment}
          className="w-full flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une échéance</span>
        </Button>

        {errors.schedule && (
          <p className="text-sm text-destructive">{errors.schedule}</p>
        )}
      </CardContent>
    </Card>
  );
}

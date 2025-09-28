import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, DollarSign, FileText, CreditCard, Banknote, Plus } from 'lucide-react';
import { PaymentPlanFormData, CheckData, PAYMENT_MODES } from '../../types/payment';
import CheckForm from '../expense/CheckForm';

interface EcheanceFormProps {
  echeance: PaymentPlanFormData;
  index: number;
  onUpdate: (index: number, field: keyof PaymentPlanFormData, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const EcheanceForm: React.FC<EcheanceFormProps> = ({
  echeance,
  index,
  onUpdate,
  onRemove,
  canRemove
}) => {
  // Gestion des montants automatiques
  useEffect(() => {
    const total = echeance.montant_declare + echeance.montant_non_declare;
    if (total !== echeance.montant_prevu) {
      onUpdate(index, 'montant_prevu', total);
    }
  }, [echeance.montant_declare, echeance.montant_non_declare, index, onUpdate]);

  // Gestion des montants selon le mode de paiement
  const handlePaymentModeChange = (mode: PaymentPlanFormData['mode_paiement']) => {
    onUpdate(index, 'mode_paiement', mode);
    
    if (mode === 'cheque') {
      onUpdate(index, 'montant_cheque', echeance.montant_prevu);
      onUpdate(index, 'montant_espece', 0);
    } else if (mode === 'espece') {
      onUpdate(index, 'montant_cheque', 0);
      onUpdate(index, 'montant_espece', echeance.montant_prevu);
    } else if (mode === 'cheque_espece') {
      // Répartition par défaut 70% chèque, 30% espèces
      const montantCheque = Math.round(echeance.montant_prevu * 0.7);
      const montantEspece = echeance.montant_prevu - montantCheque;
      onUpdate(index, 'montant_cheque', montantCheque);
      onUpdate(index, 'montant_espece', montantEspece);
    } else if (mode === 'virement') {
      onUpdate(index, 'montant_cheque', 0);
      onUpdate(index, 'montant_espece', 0);
    }
  };

  const handleChequesChange = (cheques: CheckData[]) => {
    onUpdate(index, 'cheques', cheques);
  };

  const handleTotalChequeAmountChange = (amount: number) => {
    onUpdate(index, 'montant_cheque', amount);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          Échéance {echeance.numero_echeance}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="inline h-4 w-4 mr-1" />
            Description *
          </label>
          <input
            type="text"
            value={echeance.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Avance à la signature"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date prévue *
          </label>
          <input
            type="date"
            value={echeance.date_prevue}
            onChange={(e) => onUpdate(index, 'date_prevue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Montants principal/autre montant */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 mb-2">Répartition fiscale</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Montant principal (DH)
            </label>
            <input
              type="number"
              value={echeance.montant_declare}
              onChange={(e) => onUpdate(index, 'montant_declare', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Autre montant (DH)
            </label>
            <input
              type="number"
              value={echeance.montant_non_declare}
              onChange={(e) => onUpdate(index, 'montant_non_declare', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total échéance (DH)
            </label>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-semibold text-blue-900">
              {echeance.montant_prevu.toLocaleString()} DH
            </div>
          </div>
        </div>
      </div>

      {/* Mode de paiement */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 mb-2">Mode de paiement</h5>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Méthode de paiement *
            </label>
            <select
              value={echeance.mode_paiement}
              onChange={(e) => handlePaymentModeChange(e.target.value as PaymentPlanFormData['mode_paiement'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(PAYMENT_MODES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Formulaires de chèques pour les modes cheque et cheque_espece */}
          {(echeance.mode_paiement === 'cheque' || echeance.mode_paiement === 'cheque_espece') && (
            <div className="space-y-4">
              <CheckForm
                cheques={echeance.cheques}
                onChequesChange={handleChequesChange}
                totalChequeAmount={echeance.montant_cheque}
                onTotalChequeAmountChange={handleTotalChequeAmountChange}
              />
            </div>
          )}

          {/* Résumé des paiements */}
          {echeance.mode_paiement !== 'virement' && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              {echeance.mode_paiement !== 'espece' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Montant des chèques :</span>
                  <span className="font-medium">{echeance.montant_cheque.toLocaleString()} DH</span>
                </div>
              )}
              {echeance.mode_paiement !== 'cheque' && echeance.mode_paiement !== 'virement' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Montant en espèces :</span>
                  <span className="font-medium">{echeance.montant_espece.toLocaleString()} DH</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Total des paiements :</span>
                <span className="font-bold text-primary">
                  {(echeance.montant_cheque + echeance.montant_espece).toLocaleString()} DH
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <input
          type="text"
          value={echeance.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Notes optionnelles"
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, FileText, Zap } from 'lucide-react';
import { PaymentPlanFormData, PaymentTemplate, PAYMENT_TEMPLATES } from '../../types/payment';
import { EcheanceForm } from './EcheanceForm';

interface PaymentPlanBuilderProps {
  totalAmount: number;
  onPlanChange: (plan: PaymentPlanFormData[]) => void;
  initialPlan?: PaymentPlanFormData[];
}

export const PaymentPlanBuilder: React.FC<PaymentPlanBuilderProps> = ({
  totalAmount,
  onPlanChange,
  initialPlan = []
}) => {
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanFormData[]>(initialPlan);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    onPlanChange(paymentPlan);
  }, [paymentPlan, onPlanChange]);

  const addEcheance = () => {
    const newEcheance: PaymentPlanFormData = {
      numero_echeance: paymentPlan.length + 1,
      description: `Échéance ${paymentPlan.length + 1}`,
      montant_prevu: 0,
      montant_declare: 0,
      montant_non_declare: 0,
      mode_paiement: 'espece',
      montant_cheque: 0,
      montant_espece: 0,
      date_prevue: new Date().toISOString().split('T')[0],
      notes: '',
      cheques: []
    };
    setPaymentPlan([...paymentPlan, newEcheance]);
  };

  const removeEcheance = (index: number) => {
    const newPlan = paymentPlan.filter((_, i) => i !== index);
    // Renuméroter les échéances
    const renumberedPlan = newPlan.map((echeance, i) => ({
      ...echeance,
      numero_echeance: i + 1
    }));
    setPaymentPlan(renumberedPlan);
  };

  const updateEcheance = (index: number, field: keyof PaymentPlanFormData, value: string | number) => {
    const newPlan = [...paymentPlan];
    newPlan[index] = { ...newPlan[index], [field]: value };
    setPaymentPlan(newPlan);
  };

  const applyTemplate = (template: PaymentTemplate) => {
    const today = new Date();
    const newPlan: PaymentPlanFormData[] = template.echeances.map((echeance) => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + echeance.jours_apres_signature);

      const montantEcheance = Math.round((totalAmount * echeance.pourcentage) / 100);
      const montantDeclare = Math.round((montantEcheance * echeance.pourcentage_declare) / 100);
      const montantNonDeclare = montantEcheance - montantDeclare;

      // Calculer les montants selon le mode de paiement
      let montantCheque = 0;
      let montantEspece = 0;

      if (echeance.mode_paiement === 'cheque') {
        montantCheque = montantEcheance;
      } else if (echeance.mode_paiement === 'espece') {
        montantEspece = montantEcheance;
      } else if (echeance.mode_paiement === 'cheque_espece') {
        // Par défaut, 70% chèque, 30% espèces pour le mode mixte
        montantCheque = Math.round(montantEcheance * 0.7);
        montantEspece = montantEcheance - montantCheque;
      }

      return {
        numero_echeance: echeance.numero,
        description: echeance.description,
        montant_prevu: montantEcheance,
        montant_declare: montantDeclare,
        montant_non_declare: montantNonDeclare,
        mode_paiement: echeance.mode_paiement,
        montant_cheque: montantCheque,
        montant_espece: montantEspece,
        date_prevue: dueDate.toISOString().split('T')[0],
        notes: '',
        cheques: []
      };
    });

    setPaymentPlan(newPlan);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  const getTotalPlanned = () => {
    return paymentPlan.reduce((sum, echeance) => sum + (echeance.montant_prevu || 0), 0);
  };

  const getRemainingAmount = () => {
    return totalAmount - getTotalPlanned();
  };

  const distributeRemainingAmount = () => {
    if (paymentPlan.length === 0) return;
    
    const remaining = getRemainingAmount();
    const amountPerEcheance = Math.floor(remaining / paymentPlan.length);
    const remainder = remaining % paymentPlan.length;
    
    const newPlan = paymentPlan.map((echeance, index) => ({
      ...echeance,
      montant_prevu: echeance.montant_prevu + amountPerEcheance + (index < remainder ? 1 : 0)
    }));
    
    setPaymentPlan(newPlan);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec templates */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plan de paiement</h3>
          <p className="text-sm text-gray-600">
            Montant total: {totalAmount.toLocaleString()} DH
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
          >
            <Zap className="h-4 w-4" />
            Templates
          </button>
          <button
            type="button"
            onClick={addEcheance}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            Ajouter échéance
          </button>
        </div>
      </div>

      {/* Templates prédéfinis */}
      {showTemplates && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3">Templates prédéfinis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PAYMENT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className="text-left p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="font-medium text-purple-900">{template.name}</div>
                <div className="text-sm text-purple-600 mt-1">{template.description}</div>
                <div className="text-xs text-purple-500 mt-2">
                  {template.echeances.length} échéances
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste des échéances */}
      <div className="space-y-4">
        {paymentPlan.map((echeance, index) => (
          <EcheanceForm
            key={index}
            echeance={echeance}
            index={index}
            onUpdate={updateEcheance}
            onRemove={removeEcheance}
            canRemove={paymentPlan.length > 1}
          />
        ))}
      </div>

      {/* Résumé */}
      {paymentPlan.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-900">Résumé du plan</span>
            {getRemainingAmount() !== 0 && (
              <button
                type="button"
                onClick={distributeRemainingAmount}
                className="text-sm text-blue-700 hover:text-blue-800 underline"
              >
                Répartir le reste
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-600">Total planifié</div>
              <div className="font-semibold text-blue-900">
                {getTotalPlanned().toLocaleString()} DH
              </div>
            </div>
            <div>
              <div className="text-blue-600">Montant restant</div>
              <div className={`font-semibold ${getRemainingAmount() === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {getRemainingAmount().toLocaleString()} DH
              </div>
            </div>
            <div>
              <div className="text-blue-600">Nombre d'échéances</div>
              <div className="font-semibold text-blue-900">
                {paymentPlan.length}
              </div>
            </div>
          </div>
          
          {getRemainingAmount() !== 0 && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ Le montant total planifié ne correspond pas au prix de vente
            </div>
          )}
        </div>
      )}

      {/* Message si aucune échéance */}
      {paymentPlan.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune échéance définie</p>
          <p className="text-sm">Cliquez sur "Ajouter échéance" ou utilisez un template</p>
        </div>
      )}
    </div>
  );
};

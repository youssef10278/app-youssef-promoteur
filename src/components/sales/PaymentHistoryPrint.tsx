import React from 'react';
import { Sale, PaymentPlan } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { PAYMENT_MODES, SALE_STATUS, PROPERTY_TYPES } from '@/types/sale-new';
import { enrichPaymentPlansWithInitialAdvance, calculateUnifiedPaymentTotals } from '@/utils/paymentHistory';

interface PaymentHistoryPrintProps {
  sale: Sale;
  paymentPlans: PaymentPlan[];
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    footerText?: string;
    additionalInfo?: string;
  };
}

interface SaleWithPayments extends Sale {
  payment_plans?: PaymentPlan[];
}

export const PaymentHistoryPrint: React.FC<PaymentHistoryPrintProps> = ({ 
  sale, 
  paymentPlans,
  companyInfo = {
    name: "RealtySimplify Hub",
    address: "Adresse de l'entreprise",
    phone: "Téléphone de l'entreprise",
    email: "email@entreprise.com",
    website: "www.entreprise.com",
    footerText: "Pour toute question, contactez-nous",
    additionalInfo: ""
  }
}) => {
  // Utiliser la logique unifiée pour enrichir les payment_plans
  const paymentTotals = calculateUnifiedPaymentTotals(sale, paymentPlans);
  const { totalPaid: totalPaye, remainingAmount: totalRestant, percentage: progression, enrichedPaymentPlans } = paymentTotals;
  const allPayments = enrichedPaymentPlans;

  const getPaymentModeLabel = (mode: string) => {
    return PAYMENT_MODES[mode as keyof typeof PAYMENT_MODES] || mode;
  };

  const getStatusLabel = (status: string) => {
    return SALE_STATUS[status as keyof typeof SALE_STATUS] || status;
  };

  const getPropertyTypeLabel = (type: string) => {
    return PROPERTY_TYPES[type as keyof typeof PROPERTY_TYPES] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="print-container" style={{ 
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#000',
      maxWidth: '210mm',
      margin: '0 auto',
      padding: '20mm',
      backgroundColor: '#fff'
    }}>
      {/* En-tête de l'entreprise */}
      <div style={{ 
        borderBottom: '2px solid #333',
        paddingBottom: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 5px 0',
          color: '#333'
        }}>
          {companyInfo.name}
        </h1>
        <div style={{ fontSize: '10px', color: '#666' }}>
          <div>{companyInfo.address}</div>
          <div>Tél: {companyInfo.phone} | Email: {companyInfo.email}</div>
          {companyInfo.website && (
            <div>Site web: {companyInfo.website}</div>
          )}
          {companyInfo.additionalInfo && (
            <div style={{ marginTop: '3px', fontSize: '9px' }}>{companyInfo.additionalInfo}</div>
          )}
        </div>
      </div>

      {/* Titre du document */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ 
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0',
          color: '#333'
        }}>
          HISTORIQUE DES PAIEMENTS
        </h2>
        <div style={{ 
          fontSize: '10px',
          color: '#666',
          marginTop: '5px'
        }}>
          Document généré le {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* Informations du client et de la vente */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '25px',
        border: '1px solid #ddd',
        padding: '15px',
        borderRadius: '5px'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            color: '#333',
            borderBottom: '1px solid #eee',
            paddingBottom: '5px'
          }}>
            Informations Client
          </h3>
          <div style={{ marginBottom: '5px' }}>
            <strong>Nom:</strong> {sale.client_nom}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Téléphone:</strong> {sale.client_telephone}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Email:</strong> {sale.client_email}
          </div>
          <div>
            <strong>Adresse:</strong> {sale.client_adresse}
          </div>
        </div>

        <div>
          <h3 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            color: '#333',
            borderBottom: '1px solid #eee',
            paddingBottom: '5px'
          }}>
            Détails de la Vente
          </h3>
          <div style={{ marginBottom: '5px' }}>
            <strong>Unité:</strong> {sale.unite_numero}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Type:</strong> {getPropertyTypeLabel(sale.type_propriete)}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Surface:</strong> {sale.surface}m²
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Prix total:</strong> {formatAmount(sale.prix_total)} DH
          </div>
          <div>
            <strong>Statut:</strong> {getStatusLabel(sale.statut)}
          </div>
        </div>
      </div>

      {/* Résumé financier */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '25px'
      }}>
        <h3 style={{ 
          fontSize: '14px',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          color: '#333'
        }}>
          Résumé Financier
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          textAlign: 'center'
        }}>
          <div style={{ 
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '5px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d5a2d' }}>
              {formatAmount(totalPaye)} DH
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>Montant Payé</div>
          </div>
          <div style={{ 
            padding: '10px',
            backgroundColor: '#fff3cd',
            borderRadius: '5px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404' }}>
              {formatAmount(totalRestant)} DH
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>Montant Restant</div>
          </div>
          <div style={{ 
            padding: '10px',
            backgroundColor: '#d1ecf1',
            borderRadius: '5px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0c5460' }}>
              {progression.toFixed(1)}%
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>Progression</div>
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div>
        <h3 style={{ 
          fontSize: '14px',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          color: '#333'
        }}>
          Détail des Paiements
        </h3>
        
        {allPayments.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: '30px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            Aucun paiement enregistré
          </div>
        ) : (
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  #
                </th>
                <th style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  Date
                </th>
                <th style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  Mode de Paiement
                </th>
                <th style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  Montant (DH)
                </th>
                <th style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {allPayments
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((plan, index) => (
                  <tr key={plan.id}>
                    <td style={{ 
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontSize: '11px'
                    }}>
                      {plan.numero_echeance}
                    </td>
                    <td style={{ 
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontSize: '11px'
                    }}>
                      {formatDate(plan.created_at)}
                    </td>
                    <td style={{ 
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontSize: '11px'
                    }}>
                      {getPaymentModeLabel(plan.mode_paiement || 'espece')}
                    </td>
                    <td style={{ 
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'right',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {formatAmount(plan.montant_paye || 0)}
                    </td>
                    <td style={{ 
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontSize: '11px'
                    }}>
                      {plan.notes || '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                <td colSpan={3} style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  fontSize: '11px',
                  textAlign: 'right'
                }}>
                  TOTAL PAYÉ:
                </td>
                <td style={{ 
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {formatAmount(totalPaye)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '1px solid #ddd',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        <div>Ce document a été généré automatiquement par {companyInfo.name}</div>
        <div style={{ marginTop: '5px' }}>
          {companyInfo.footerText || 'Pour toute question, contactez-nous'} au {companyInfo.phone} ou {companyInfo.email}
        </div>
        {companyInfo.website && (
          <div style={{ marginTop: '3px' }}>
            Visitez notre site web: {companyInfo.website}
          </div>
        )}
      </div>
    </div>
  );
};

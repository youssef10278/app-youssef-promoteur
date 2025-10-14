import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Download, Database, FileText, DollarSign, Receipt, CreditCard } from 'lucide-react';
import { apiClient } from '../../integrations/api/client';

export const DataExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const downloadFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      console.log('📤 Début export global...');
      
      const response = await apiClient.get('/data-export/export-all');
      
      console.log('✅ Export global réussi:', response.data);
      
      const fileName = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(response.data, fileName);
      
      toast({
        title: "Export réussi",
        description: `Toutes vos données ont été exportées dans ${fileName}`,
      });
    } catch (error) {
      console.error('❌ Erreur export global:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSpecific = async (dataType: string, label: string) => {
    setIsExporting(true);
    try {
      console.log(`📤 Début export ${dataType}...`);
      
      const response = await apiClient.get(`/data-export/export/${dataType}`);
      
      console.log(`✅ Export ${dataType} réussi:`, response.data);
      
      const fileName = `export-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(response.data, fileName);
      
      toast({
        title: "Export réussi",
        description: `${label} exporté(s) dans ${fileName}`,
      });
    } catch (error) {
      console.error(`❌ Erreur export ${dataType}:`, error);
      toast({
        title: "Erreur d'export",
        description: `Impossible d'exporter ${label.toLowerCase()}. Veuillez réessayer.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    { type: 'projects', label: 'Projets', icon: FileText, description: 'Tous vos projets' },
    { type: 'sales', label: 'Ventes', icon: DollarSign, description: 'Toutes vos ventes' },
    { type: 'expenses', label: 'Dépenses', icon: Receipt, description: 'Toutes vos dépenses' },
    { type: 'checks', label: 'Chèques', icon: CreditCard, description: 'Tous vos chèques' },
    { type: 'payments', label: 'Paiements', icon: CreditCard, description: 'Tous vos paiements' }
  ];

  return (
    <div className="space-y-6">
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export de Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Exportez vos données au format JSON pour créer des sauvegardes ou transférer vos informations.
            </AlertDescription>
          </Alert>

          {/* Export Global */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Global</h3>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Toutes les données</h4>
                  <p className="text-sm text-muted-foreground">
                    Exporte tous vos projets, ventes, dépenses, chèques et paiements
                  </p>
                </div>
                <Button
                  onClick={handleExportAll}
                  disabled={isExporting}
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Export...' : 'Exporter Tout'}
                </Button>
              </div>
            </div>
          </div>

          {/* Export Sélectif */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Sélectif</h3>
            <div className="grid gap-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.type} className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{option.label}</h4>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportSpecific(option.type, option.label)}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informations */}
          <Alert>
            <AlertDescription>
              <strong>Format :</strong> Les fichiers sont exportés au format JSON avec métadonnées (date, nombre d'enregistrements).
              <br />
              <strong>Sécurité :</strong> Seules vos données personnelles sont exportées.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

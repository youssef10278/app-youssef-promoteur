import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileText, DollarSign, Receipt, CreditCard } from 'lucide-react';
import { apiClient } from '../../integrations/api/client';

export const DataImportExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'ignore' | 'replace' | 'create_new'>('ignore');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "Fichier requis",
        description: "Veuillez sélectionner un fichier JSON à importer.",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Format invalide",
        description: "Seuls les fichiers JSON sont supportés.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      console.log('📥 Début import fichier:', file.name);

      const fileContent = await file.text();
      console.log('📄 Contenu fichier (200 premiers caractères):', fileContent.substring(0, 200));
      console.log('📄 Taille fichier:', fileContent.length, 'caractères');

      // VALIDATION STRICTE comme suggéré par l'expert
      if (!fileContent || fileContent.trim() === '') {
        throw new Error('Le fichier est vide');
      }

      if (fileContent.trim() === 'undefined' || fileContent.trim() === 'null') {
        console.error('🚨 PROBLÈME DÉTECTÉ: Le backend a renvoyé undefined/null au lieu de JSON');
        console.error('📄 Contenu reçu:', fileContent);
        throw new Error('Le fichier contient des données invalides (undefined/null) - problème backend détecté. Veuillez réessayer l\'export.');
      }

      // Tentative de parsing JSON avec gestion d'erreur détaillée
      let importData;
      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        console.error('📄 Contenu problématique (500 premiers caractères):', fileContent.substring(0, 500));
        throw new Error(`Le fichier est corrompu ou non valide: ${(parseError as Error).message}`);
      }

      console.log('📋 Données parsées:', importData);

      // Validation de la structure JSON
      if (!importData || typeof importData !== 'object') {
        throw new Error('Le fichier ne contient pas un objet JSON valide');
      }

      // Détecter le type de données
      let dataType: string;
      let data: any[];

      if (importData.export_info && importData.export_info.data_type) {
        // Export sélectif
        dataType = importData.export_info.data_type;
        data = importData.data || [];
      } else if (importData.projects || importData.sales || importData.expenses || importData.checks || importData.payments) {
        // Export global - demander à l'utilisateur quel type importer
        const types = [];
        if (importData.projects?.length) types.push('projects');
        if (importData.sales?.length) types.push('sales');
        if (importData.expenses?.length) types.push('expenses');
        if (importData.checks?.length) types.push('checks');
        if (importData.payments?.length) types.push('payments');

        if (types.length === 0) {
          throw new Error('Aucune donnée trouvée dans le fichier');
        }

        // Pour l'instant, importer le premier type trouvé
        dataType = types[0];
        data = importData[dataType];

        toast({
          title: "Import partiel",
          description: `Import de ${dataType} uniquement. Fichier contient: ${types.join(', ')}`,
        });
      } else {
        throw new Error('Format de fichier non reconnu');
      }

      console.log(`📥 Import ${dataType}:`, data.length, 'enregistrements');

      const response = await apiClient.post('/data-export/import', {
        data,
        dataType,
        strategy: importStrategy
      });

      console.log('✅ Import réussi:', response.data);

      const result = response.data.data;
      toast({
        title: "Import réussi",
        description: `${result.imported} importés, ${result.skipped} ignorés sur ${result.total} total`,
      });

      // Réinitialiser le fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Erreur import:', error);
      toast({
        title: "Erreur d'import",
        description: `Impossible d'importer le fichier: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
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
            Import / Export de Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Exportez vos données au format JSON pour créer des sauvegardes ou importez des données depuis un fichier JSON.
            </AlertDescription>
          </Alert>

          {/* Import de Données */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import de Données</h3>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="import-file">Fichier JSON</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      ref={fileInputRef}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-strategy">Stratégie de doublons</Label>
                    <Select value={importStrategy} onValueChange={(value: any) => setImportStrategy(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">Ignorer les doublons</SelectItem>
                        <SelectItem value="replace">Remplacer les doublons</SelectItem>
                        <SelectItem value="create_new">Créer de nouveaux enregistrements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Import en cours...' : 'Importer les Données'}
                </Button>
              </div>
            </div>
          </div>

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
              <strong>Export :</strong> Les fichiers sont exportés au format JSON avec métadonnées.
              <br />
              <strong>Import :</strong> Seuls les fichiers JSON d'export sont supportés.
              <br />
              <strong>Sécurité :</strong> Seules vos données personnelles sont traitées.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

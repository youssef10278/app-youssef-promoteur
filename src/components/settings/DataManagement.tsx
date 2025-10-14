import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Upload,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  History,
  HardDrive
} from 'lucide-react';

import {
  DataOperationsService,
  DataOperation,
  DataType,
  DuplicateStrategy,
  ValidationResponse,
  ImportResponse,
  ExportResponse
} from '../../services/dataOperationsServiceNew';

// Labels pour l'interface
const DATA_TYPE_LABELS: Record<DataType, string> = {
  global: 'Toutes les données',
  projects: 'Projets',
  sales: 'Ventes',
  expenses: 'Dépenses',
  checks: 'Chèques',
  payments: 'Paiements'
};

const DUPLICATE_STRATEGY_LABELS: Record<DuplicateStrategy, string> = {
  ignore: 'Ignorer les doublons',
  replace: 'Remplacer les doublons',
  create_new: 'Créer de nouveaux enregistrements'
};

const OPERATION_TYPE_LABELS = {
  export: 'Export',
  import: 'Import'
};

const STATUS_LABELS = {
  pending: 'En cours',
  completed: 'Terminé',
  failed: 'Échoué'
};

export const DataManagement: React.FC = () => {
  const { toast } = useToast();
  
  // États pour l'export
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportTypes, setSelectedExportTypes] = useState<DataType[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  
  // États pour l'import
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<DataType>('projects');
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('ignore');
  const [validationResult, setValidationResult] = useState<any>(null);
  
  // États pour l'historique
  const [operations, setOperations] = useState<DataOperation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Charger l'historique au montage
  useEffect(() => {
    loadOperationsHistory();
  }, []);

  const loadOperationsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await DataOperationsService.getOperations(1, 10);
      setOperations(result.operations);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ==================== EXPORT ====================

  const handleExportGlobal = async () => {
    setIsExporting(true);
    try {
      const result = await DataOperationsService.exportGlobal();
      
      toast({
        title: "Export réussi",
        description: `Fichier créé: ${result.file_name} (${DataOperationsService.formatFileSize(result.file_size)})`,
      });

      // Télécharger automatiquement
      await DataOperationsService.downloadExport(result.operation_id);
      
      // Recharger l'historique
      loadOperationsHistory();
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelective = async () => {
    if (selectedExportTypes.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un type de données",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = await DataOperationsService.exportSelective(selectedExportTypes, exportFormat);
      
      toast({
        title: "Export sélectif réussi",
        description: `${result.records_count} enregistrements exportés`,
      });

      loadOperationsHistory();
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données sélectionnées",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTypeToggle = (dataType: DataType) => {
    setSelectedExportTypes(prev => 
      prev.includes(dataType)
        ? prev.filter(t => t !== dataType)
        : [...prev, dataType]
    );
  };

  // ==================== IMPORT ====================

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 Fichier sélectionné:', file);

    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    console.log('✅ Fichier valide:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setImportFile(file);
    setValidationResult(null);

    // Validation automatique
    try {
      console.log('🔍 Début validation pour type:', importType);
      const result = await DataOperationsService.validateImport(file, importType);
      console.log('✅ Résultat validation:', result);
      setValidationResult(result);

      if (!result.valid) {
        toast({
          title: "Fichier invalide",
          description: `${result.errors.length} erreur(s) détectée(s)`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider le fichier",
        variant: "destructive",
      });
    }
  };

  const handleImportGlobal = async () => {
    console.log('🔍 handleImportGlobal appelé, fichier:', importFile);

    if (!importFile) {
      console.error('❌ Aucun fichier sélectionné');
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      });
      return;
    }

    console.log('📁 Fichier à importer:', {
      name: importFile.name,
      size: importFile.size,
      type: importFile.type
    });

    setIsImporting(true);
    try {
      const result = await DataOperationsService.importGlobal(importFile, duplicateStrategy);

      toast({
        title: "Import réussi",
        description: `${result.records_imported} enregistrements importés, ${result.records_skipped} ignorés`,
      });

      setImportFile(null);
      setValidationResult(null);
      loadOperationsHistory();
    } catch (error) {
      console.error('❌ Erreur import:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les données",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ==================== UTILITAIRES ====================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationIcon = (type: string) => {
    return type === 'export' 
      ? <Download className="h-4 w-4 text-blue-600" />
      : <Upload className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-3">
        <HardDrive className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Gestion des Données</h2>
          <p className="text-sm text-muted-foreground">
            Exportez et importez vos données pour sauvegarder ou migrer
          </p>
        </div>
      </div>

      {/* Export Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Export des Données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Global */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium mb-2">Export Global</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Exporte toutes vos données (projets, ventes, dépenses, chèques) en un seul fichier JSON
            </p>
            <Button 
              onClick={handleExportGlobal}
              disabled={isExporting}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Export en cours...' : 'Exporter Tout (JSON)'}
            </Button>
          </div>

          {/* Export Sélectif */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Export Sélectif</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['projects', 'sales', 'expenses', 'checks'] as DataType[]).map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedExportTypes.includes(type)}
                    onCheckedChange={() => handleExportTypeToggle(type)}
                  />
                  <Label htmlFor={type} className="text-sm">
                    {DATA_TYPE_LABELS[type]}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3 mb-4">
              <Label htmlFor="format">Format:</Label>
              <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExportSelective}
              disabled={isExporting || selectedExportTypes.length === 0}
              variant="outline"
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              {isExporting ? 'Export en cours...' : 'Exporter Sélection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-green-600" />
            <span>Import des Données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention :</strong> L'import peut modifier vos données existantes. 
              Nous recommandons de faire un export avant d'importer.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Fichier à importer</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="duplicate-strategy">Gestion des doublons</Label>
              <Select 
                value={duplicateStrategy} 
                onValueChange={(value: DuplicateStrategy) => setDuplicateStrategy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DUPLICATE_STRATEGY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {validationResult && (
              <div className={`p-3 rounded-lg ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {validationResult.valid ? 'Fichier valide' : 'Fichier invalide'}
                  </span>
                </div>
                <p className="text-sm">
                  {validationResult.records_count} enregistrements détectés
                  {validationResult.duplicates_found > 0 && 
                    `, ${validationResult.duplicates_found} doublons potentiels`
                  }
                </p>
                {validationResult.errors.length > 0 && (
                  <ul className="text-sm text-red-600 mt-2">
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Button 
              onClick={handleImportGlobal}
              disabled={isImporting || !importFile || (validationResult && !validationResult.valid)}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Import en cours...' : 'Importer les Données'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique des Opérations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-600" />
            <span>Historique des Opérations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-center py-4">
              <Clock className="h-6 w-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">Aucune opération effectuée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getOperationIcon(operation.operation_type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {OPERATION_TYPE_LABELS[operation.operation_type]} {DATA_TYPE_LABELS[operation.data_type]}
                        </span>
                        <Badge variant={operation.status === 'completed' ? 'default' : 'destructive'}>
                          {STATUS_LABELS[operation.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {DataOperationsService.formatDate(operation.created_at)}
                        {operation.file_size && ` • ${DataOperationsService.formatFileSize(operation.file_size)}`}
                        {operation.records_count && ` • ${operation.records_count} enregistrements`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(operation.status)}
                    {operation.operation_type === 'export' && operation.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => DataOperationsService.downloadExport(operation.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {operations.length >= 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadOperationsHistory}>
                    Voir plus
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

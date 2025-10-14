import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { DataOperationsService, DataType, DuplicateStrategy, ExportFormat } from '@/services/dataOperationsServiceNew';

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

export default function DataManagementNew() {
  // États pour l'import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDataType, setImportDataType] = useState<DataType>('global');
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('ignore');
  const [importLoading, setImportLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // États pour l'export
  const [exportDataTypes, setExportDataTypes] = useState<DataType[]>(['projects']);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportLoading, setExportLoading] = useState(false);

  // États généraux
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion de la sélection de fichier
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationResult(null);
    setMessage(null);

    // Validation automatique
    try {
      setImportLoading(true);
      const result = await DataOperationsService.validateImport(file, importDataType);
      setValidationResult(result);
      
      if (result.valid) {
        setMessage({ 
          type: 'success', 
          text: `Fichier valide: ${result.records_count} enregistrements détectés` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Erreurs de validation: ${result.errors.join(', ')}` 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Erreur de validation: ${error.message}` 
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Import des données
  const handleImport = async () => {
    if (!importFile || !validationResult?.valid) return;

    try {
      setImportLoading(true);
      const result = await DataOperationsService.importData(importFile, importDataType, duplicateStrategy);
      
      setMessage({ 
        type: 'success', 
        text: `Import réussi: ${result.records_imported} enregistrements importés, ${result.records_skipped} ignorés` 
      });
      
      // Reset
      setImportFile(null);
      setValidationResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Erreur d'import: ${error.message}` 
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Export global
  const handleExportGlobal = async () => {
    try {
      setExportLoading(true);
      const result = await DataOperationsService.exportGlobal(exportFormat);
      
      setMessage({ 
        type: 'success', 
        text: `Export global réussi: ${result.records_count} enregistrements` 
      });
      
      // Déclencher le téléchargement
      await DataOperationsService.downloadExport(result.operation_id);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Erreur d'export: ${error.message}` 
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Export sélectif
  const handleExportSelective = async () => {
    if (exportDataTypes.length === 0) {
      setMessage({ type: 'error', text: 'Sélectionnez au moins un type de données' });
      return;
    }

    try {
      setExportLoading(true);
      const result = await DataOperationsService.exportSelective(exportDataTypes, exportFormat);
      
      setMessage({ 
        type: 'success', 
        text: `Export sélectif réussi: ${result.records_count} enregistrements` 
      });
      
      // Déclencher le téléchargement
      await DataOperationsService.downloadExport(result.operation_id);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Erreur d'export: ${error.message}` 
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Gestion de la sélection des types de données pour l'export
  const handleDataTypeToggle = (dataType: DataType, checked: boolean) => {
    if (checked) {
      setExportDataTypes(prev => [...prev, dataType]);
    } else {
      setExportDataTypes(prev => prev.filter(type => type !== dataType));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Gestion des Données</h2>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : message.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
          {message.type === 'error' && <XCircle className="h-4 w-4" />}
          {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {message.type === 'info' && <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* ONGLET IMPORT */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import de Données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataType">Type de données</Label>
                  <Select value={importDataType} onValueChange={(value: DataType) => setImportDataType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATA_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duplicateStrategy">Gestion des doublons</Label>
                  <Select value={duplicateStrategy} onValueChange={(value: DuplicateStrategy) => setDuplicateStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DUPLICATE_STRATEGY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fichier (JSON ou CSV)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  disabled={importLoading}
                />
              </div>

              {validationResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {validationResult.valid ? 'Fichier valide' : 'Erreurs détectées'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Enregistrements: {validationResult.records_count}</p>
                    {validationResult.errors.length > 0 && (
                      <div className="text-red-600">
                        <p>Erreurs:</p>
                        <ul className="list-disc list-inside">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div className="text-yellow-600">
                        <p>Avertissements:</p>
                        <ul className="list-disc list-inside">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleImport}
                disabled={!importFile || !validationResult?.valid || importLoading}
                className="w-full"
              >
                {importLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer les données
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Global */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Global
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExportGlobal}
                  disabled={exportLoading}
                  className="w-full"
                >
                  {exportLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter tout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Export Sélectif */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Export Sélectif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Types de données</Label>
                  <div className="space-y-2">
                    {(Object.entries(DATA_TYPE_LABELS) as [DataType, string][])
                      .filter(([key]) => key !== 'global')
                      .map(([value, label]) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={value}
                          checked={exportDataTypes.includes(value)}
                          onCheckedChange={(checked) => handleDataTypeToggle(value, checked as boolean)}
                        />
                        <Label htmlFor={value}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleExportSelective}
                  disabled={exportLoading || exportDataTypes.length === 0}
                  className="w-full"
                >
                  {exportLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter sélection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/integrations/api/client';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  data?: any;
  error?: string;
  duration?: number;
}

const ApiDiagnostic: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { name: 'Projects Stats', endpoint: '/projects/stats', params: { period: 'this_month' } },
    { name: 'Sales Stats', endpoint: '/sales/stats', params: { period: 'this_month' } },
    { name: 'Expenses Stats', endpoint: '/expenses/stats', params: { period: 'this_month' } },
    { name: 'Checks Stats', endpoint: '/checks/stats', params: { period: 'this_month' } },
    { name: 'Payments Stats', endpoint: '/payments/stats', params: { period: 'this_month' } },
    { name: 'Projects List', endpoint: '/projects', params: {} },
    { name: 'Sales List', endpoint: '/sales', params: {} },
  ];

  const testEndpoint = async (endpoint: string, params: any): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      console.log(`Testing ${endpoint} with params:`, params);
      const response = await apiClient.get(endpoint, params);
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${endpoint} success:`, response);
      
      return {
        endpoint,
        status: 'success',
        data: response.data,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${endpoint} error:`, error);
      
      return {
        endpoint,
        status: 'error',
        error: error.message || 'Unknown error',
        duration
      };
    }
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    // Vérifier d'abord l'authentification
    console.log('🔐 Checking authentication...');
    console.log('Token:', apiClient.getToken());
    console.log('Is authenticated:', apiClient.isAuthenticated());

    const newResults: TestResult[] = [];

    for (const { name, endpoint, params } of endpoints) {
      // Ajouter le résultat en cours
      const pendingResult: TestResult = {
        endpoint: `${name} (${endpoint})`,
        status: 'pending'
      };
      newResults.push(pendingResult);
      setResults([...newResults]);

      // Tester l'endpoint
      const result = await testEndpoint(endpoint, params);
      result.endpoint = `${name} (${endpoint})`;
      
      // Remplacer le résultat en cours par le résultat final
      newResults[newResults.length - 1] = result;
      setResults([...newResults]);

      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Diagnostic API Dashboard
        </CardTitle>
        <CardDescription>
          Teste tous les endpoints utilisés par le dashboard pour identifier les problèmes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? '⏳ Test en cours...' : '🚀 Lancer le diagnostic'}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Token: {apiClient.isAuthenticated() ? '✅ Présent' : '❌ Manquant'}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Résultats des tests</h3>
            
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.endpoint}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                    {result.duration && (
                      <Badge variant="outline">
                        {result.duration}ms
                      </Badge>
                    )}
                  </div>
                </div>

                {result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                    <p className="text-red-800 text-sm font-medium">Erreur:</p>
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                )}

                {result.data && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                    <p className="text-green-800 text-sm font-medium">Données reçues:</p>
                    <pre className="text-green-700 text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-blue-800 font-medium mb-2">📊 Résumé</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">
                    ✅ Succès: {results.filter(r => r.status === 'success').length}
                  </span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">
                    ❌ Erreurs: {results.filter(r => r.status === 'error').length}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-600 font-medium">
                    ⏳ En cours: {results.filter(r => r.status === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiDiagnostic;

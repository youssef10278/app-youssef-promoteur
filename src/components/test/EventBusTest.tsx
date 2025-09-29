import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eventBus, EVENTS } from '@/utils/eventBus';

/**
 * Composant de test pour l'EventBus
 * Permet de tester la communication entre les pages
 */
export const EventBusTest: React.FC = () => {
  const [events, setEvents] = useState<Array<{ event: string; data: any; timestamp: Date }>>([]);

  useEffect(() => {
    // Écouter tous les événements de chèques
    const unsubscribes = [
      eventBus.on(EVENTS.CHECK_CREATED, (data) => {
        setEvents(prev => [...prev, {
          event: 'CHECK_CREATED',
          data,
          timestamp: new Date()
        }]);
      }),
      eventBus.on(EVENTS.CHECK_UPDATED, (data) => {
        setEvents(prev => [...prev, {
          event: 'CHECK_UPDATED',
          data,
          timestamp: new Date()
        }]);
      }),
      eventBus.on(EVENTS.CHECK_DELETED, (data) => {
        setEvents(prev => [...prev, {
          event: 'CHECK_DELETED',
          data,
          timestamp: new Date()
        }]);
      })
    ];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const simulateCheckCreation = () => {
    eventBus.emit(EVENTS.CHECK_CREATED, {
      check: {
        id: `test-${Date.now()}`,
        montant: Math.floor(Math.random() * 10000),
        type_cheque: 'donne',
        numero_cheque: `TEST-${Math.floor(Math.random() * 1000)}`
      },
      source: 'test_simulation'
    });
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test EventBus - Communication entre pages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={simulateCheckCreation} variant="outline">
            Simuler création chèque
          </Button>
          <Button onClick={clearEvents} variant="outline">
            Effacer les événements
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Événements reçus ({events.length})</h3>
          {events.length === 0 ? (
            <p className="text-muted-foreground">Aucun événement reçu</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{event.event}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Instructions :</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Allez sur la page Dépenses et ajoutez une dépense avec chèque</li>
            <li>Revenez ici pour voir si l'événement CHECK_CREATED a été émis</li>
            <li>Allez sur la page Chèques pour vérifier que le chèque apparaît</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

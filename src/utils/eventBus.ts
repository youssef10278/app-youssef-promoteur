/**
 * Event Bus pour la communication entre composants
 * Permet de notifier les changements de données entre différentes pages
 */

type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * S'abonner à un événement
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event)!.push(callback);
    
    // Retourner une fonction de désabonnement
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Émettre un événement
   */
  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur lors de l'exécution du callback pour l'événement ${event}:`, error);
        }
      });
    }
  }

  /**
   * Se désabonner de tous les événements (utile pour le nettoyage)
   */
  off(event: string): void {
    this.events.delete(event);
  }

  /**
   * Nettoyer tous les événements
   */
  clear(): void {
    this.events.clear();
  }
}

// Instance singleton
export const eventBus = new EventBus();

// Constantes pour les noms d'événements
export const EVENTS = {
  CHECK_CREATED: 'check:created',
  CHECK_UPDATED: 'check:updated',
  CHECK_DELETED: 'check:deleted',
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',
  SALE_CREATED: 'sale:created',
  SALE_UPDATED: 'sale:updated',
  SALE_DELETED: 'sale:deleted',
} as const;

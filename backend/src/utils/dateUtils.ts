/**
 * Utilitaires pour la gestion des dates et périodes
 */

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Obtient les dates de début et fin pour une période donnée
 */
export function getDateRange(period: string): DateRange {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_week':
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_week':
      const lastWeekStart = new Date();
      const lastWeekDayOfWeek = now.getDay();
      const daysToLastMonday = lastWeekDayOfWeek === 0 ? 13 : lastWeekDayOfWeek + 6;
      lastWeekStart.setDate(now.getDate() - daysToLastMonday);
      lastWeekStart.setHours(0, 0, 0, 0);
      
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      
      return { start: lastWeekStart, end: lastWeekEnd };

    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_month':
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start.setMonth(currentQuarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(currentQuarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      if (lastQuarter < 0) {
        start.setFullYear(now.getFullYear() - 1, 9, 1);
        end.setFullYear(now.getFullYear() - 1, 11, 31);
      } else {
        start.setMonth(lastQuarter * 3, 1);
        end.setMonth(lastQuarter * 3 + 3, 0);
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_year':
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_7_days':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_30_days':
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_90_days':
      start.setDate(now.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      // Par défaut, retourner toute la période (pas de filtre)
      start.setFullYear(2020, 0, 1);
      end.setFullYear(2030, 11, 31);
      break;
  }

  return { start, end };
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formate une date et heure pour l'affichage
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Vérifie si une date est dans une période donnée
 */
export function isDateInPeriod(date: Date, period: string): boolean {
  const { start, end } = getDateRange(period);
  return date >= start && date <= end;
}

/**
 * Calcule la différence en jours entre deux dates
 */
export function daysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtient le début du mois pour une date donnée
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Obtient la fin du mois pour une date donnée
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

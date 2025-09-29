import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export type DateFilterPeriod = 
  | 'today'
  | 'yesterday' 
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom'
  | 'all';

export interface DateFilterValue {
  period: DateFilterPeriod;
  startDate?: Date;
  endDate?: Date;
}

interface DashboardDateFilterProps {
  value: DateFilterValue;
  onChange: (filter: DateFilterValue) => void;
  className?: string;
}

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes les périodes' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'last_week', label: 'Semaine dernière' },
  { value: 'this_month', label: 'Ce mois-ci' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: 'this_quarter', label: 'Ce trimestre' },
  { value: 'last_quarter', label: 'Trimestre dernier' },
  { value: 'this_year', label: 'Cette année' },
  { value: 'last_year', label: 'Année dernière' },
  { value: 'custom', label: 'Période personnalisée' },
] as const;

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const getDateRange = (period: DateFilterPeriod): { startDate?: Date; endDate?: Date } => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      case 'this_week':
        return { startDate: startOfWeek(now, { locale: fr }), endDate: endOfWeek(now, { locale: fr }) };
      case 'last_week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: fr });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: fr });
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      case 'this_month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'this_quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return { startDate: quarterStart, endDate: quarterEnd };
      case 'last_quarter':
        const lastQuarterMonth = now.getMonth() - 3;
        const lastQuarterYear = lastQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedMonth = lastQuarterMonth < 0 ? lastQuarterMonth + 12 : lastQuarterMonth;
        const lastQuarterStart = new Date(lastQuarterYear, Math.floor(adjustedMonth / 3) * 3, 1);
        const lastQuarterEnd = new Date(lastQuarterYear, Math.floor(adjustedMonth / 3) * 3 + 3, 0);
        return { startDate: lastQuarterStart, endDate: lastQuarterEnd };
      case 'this_year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'last_year':
        const lastYear = subYears(now, 1);
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
      case 'all':
      default:
        return {};
    }
  };

  const handlePeriodChange = (period: DateFilterPeriod) => {
    if (period === 'custom') {
      setIsCustomDateOpen(true);
      onChange({ period, startDate: value.startDate, endDate: value.endDate });
    } else {
      const dateRange = getDateRange(period);
      onChange({ period, ...dateRange });
    }
  };

  const handleCustomDateChange = (startDate?: Date, endDate?: Date) => {
    onChange({ period: 'custom', startDate, endDate });
  };

  const clearFilter = () => {
    onChange({ period: 'all' });
  };

  const getFilterLabel = () => {
    const option = DATE_FILTER_OPTIONS.find(opt => opt.value === value.period);
    if (value.period === 'custom' && value.startDate && value.endDate) {
      return `${format(value.startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(value.endDate, 'dd/MM/yyyy', { locale: fr })}`;
    }
    return option?.label || 'Toutes les périodes';
  };

  const hasActiveFilter = value.period !== 'all';

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Période :</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Select value={value.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {value.period === 'custom' && (
              <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {value.startDate && value.endDate ? (
                      `${format(value.startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(value.endDate, 'dd/MM/yyyy', { locale: fr })}`
                    ) : (
                      'Sélectionner les dates'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date de début</label>
                      <Calendar
                        mode="single"
                        selected={value.startDate}
                        onSelect={(date) => handleCustomDateChange(date, value.endDate)}
                        locale={fr}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date de fin</label>
                      <Calendar
                        mode="single"
                        selected={value.endDate}
                        onSelect={(date) => handleCustomDateChange(value.startDate, date)}
                        locale={fr}
                        className="rounded-md border"
                        disabled={(date) => value.startDate ? date < value.startDate : false}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsCustomDateOpen(false)}>
                        Annuler
                      </Button>
                      <Button size="sm" onClick={() => setIsCustomDateOpen(false)}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {hasActiveFilter && (
              <Badge variant="secondary" className="gap-1">
                {getFilterLabel()}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={clearFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardDateFilter;

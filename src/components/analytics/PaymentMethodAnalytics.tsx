import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Banknote, Split } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodData {
  cheque: number;
  espece: number;
  total: number;
}

interface PaymentMethodAnalyticsProps {
  data: PaymentMethodData;
  title: string;
  className?: string;
}

export const PaymentMethodAnalytics = ({ data, title, className }: PaymentMethodAnalyticsProps) => {
  const chequePercentage = data.total > 0 ? (data.cheque / data.total) * 100 : 0;
  const especePercentage = data.total > 0 ? (data.espece / data.total) * 100 : 0;

  return (
    <Card className={cn("card-premium hover-lift", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Montant total */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold text-primary">
            {data.total.toLocaleString()} DH
          </div>
        </div>

        {/* Répartition */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Chèque</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{data.cheque.toLocaleString()} DH</div>
              <div className="text-xs text-muted-foreground">{chequePercentage.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={chequePercentage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Espèce</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{data.espece.toLocaleString()} DH</div>
              <div className="text-xs text-muted-foreground">{especePercentage.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={especePercentage} className="h-2" />
        </div>

        {/* Indicateurs visuels */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              {chequePercentage.toFixed(0)}% Chèque
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Banknote className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">
              {especePercentage.toFixed(0)}% Espèce
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
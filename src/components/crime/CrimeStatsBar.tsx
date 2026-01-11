import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrimeStats } from '@/hooks/useCrimeData';
import { Skeleton } from '@/components/ui/skeleton';

interface CrimeStatsBarProps {
  stats: CrimeStats | undefined;
  isLoading?: boolean;
  dateRangeLabel?: string;
  className?: string;
}

export function CrimeStatsBar({ stats, isLoading, dateRangeLabel, className }: CrimeStatsBarProps) {
  if (isLoading) {
    return (
      <div className={cn('bg-card rounded-lg p-4 shadow-card', className)}>
        <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-between">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn('bg-card rounded-lg p-4 shadow-card', className)}>
        <p className="text-muted-foreground text-sm">No statistics available</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (stats.trendPercent === undefined) return null;
    if (stats.trendPercent > 0) return <TrendingUp className="w-4 h-4" />;
    if (stats.trendPercent < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (stats.trendPercent === undefined) return 'text-muted-foreground';
    if (stats.trendPercent > 0) return 'text-destructive';
    if (stats.trendPercent < 0) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('bg-card rounded-lg p-4 shadow-card', className)}>
      <div className="flex flex-wrap gap-4 md:gap-8 items-center">
        {/* Total Incidents */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">
              Total Incidents {dateRangeLabel && `(${dateRangeLabel})`}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-12 bg-border" />

        {/* Category Breakdown */}
        <div className="flex gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <div>
              <span className="font-semibold text-card-foreground">{stats.violent}</span>
              <span className="text-xs text-muted-foreground ml-1">Violent</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <div>
              <span className="font-semibold text-card-foreground">{stats.property}</span>
              <span className="text-xs text-muted-foreground ml-1">Property</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <div>
              <span className="font-semibold text-card-foreground">{stats.other}</span>
              <span className="text-xs text-muted-foreground ml-1">Other</span>
            </div>
          </div>
        </div>

        {/* Trend */}
        {stats.trendPercent !== undefined && (
          <>
            <div className="hidden md:block w-px h-12 bg-border" />
            <div className={cn('flex items-center gap-2', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-semibold">
                {stats.trendPercent > 0 ? '+' : ''}{stats.trendPercent}%
              </span>
              <span className="text-xs text-muted-foreground">vs previous period</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
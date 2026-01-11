import { Link } from 'react-router-dom';
import { Shield, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';
import { useNeighborhoodCrimeStats } from '@/hooks/useCrimeIntegration';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NeighborhoodCrimeWidgetProps {
  neighborhoodId: string;
  neighborhoodName: string;
  className?: string;
}

export function NeighborhoodCrimeWidget({ 
  neighborhoodId, 
  neighborhoodName,
  className 
}: NeighborhoodCrimeWidgetProps) {
  const { data, isLoading } = useNeighborhoodCrimeStats(neighborhoodId);

  if (isLoading) {
    return (
      <div className={cn('bg-card rounded-xl p-5 shadow-card', className)}>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, cityAverage, comparisonPercent } = data;

  const getTrendIcon = () => {
    if (comparisonPercent > 10) return <TrendingUp className="w-4 h-4" />;
    if (comparisonPercent < -10) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (comparisonPercent > 10) return 'text-destructive';
    if (comparisonPercent < -10) return 'text-success';
    return 'text-muted-foreground';
  };

  const getTrendText = () => {
    if (comparisonPercent > 10) return 'Above average';
    if (comparisonPercent < -10) return 'Below average';
    return 'Average';
  };

  return (
    <div className={cn('bg-card rounded-xl p-5 shadow-card', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-card-foreground">Crime Stats</h3>
      </div>

      <div className="space-y-4">
        {/* Total incidents */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last 7 Days</span>
          <span className="text-2xl font-bold text-card-foreground">{stats.total}</span>
        </div>

        {/* Category breakdown */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-xs text-muted-foreground">{stats.violent} violent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-xs text-muted-foreground">{stats.property} property</span>
          </div>
        </div>

        {/* Comparison to city average */}
        <div className={cn('flex items-center gap-2 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span>{getTrendText()}</span>
          {comparisonPercent !== 0 && (
            <span className="text-xs">
              ({comparisonPercent > 0 ? '+' : ''}{comparisonPercent}% vs city avg)
            </span>
          )}
        </div>

        {/* Link to crime map */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/crime?neighborhood=${neighborhoodId}`}>
            <MapPin className="w-4 h-4 mr-2" />
            View Crime Map
          </Link>
        </Button>
      </div>
    </div>
  );
}
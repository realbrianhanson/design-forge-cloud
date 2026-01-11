import { format } from 'date-fns';
import { AlertTriangle, Shield, MapPin, Calendar } from 'lucide-react';
import { useDailyCrimeDigest } from '@/hooks/useCrimeIntegration';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DailyCrimeDigestProps {
  date?: Date;
  className?: string;
}

export function DailyCrimeDigest({ date, className }: DailyCrimeDigestProps) {
  const { data, isLoading } = useDailyCrimeDigest(date);

  if (isLoading) {
    return (
      <div className={cn('bg-card rounded-xl p-6 shadow-card', className)}>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const formattedDate = format(data.date, 'EEEE, MMMM d, yyyy');

  return (
    <div className={cn('bg-card rounded-xl overflow-hidden shadow-card', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Jacksonville Crime Report</span>
        </div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {formattedDate}
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-card-foreground">{data.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#ef4444]">{data.byCategory.violent}</div>
            <div className="text-xs text-muted-foreground">Violent</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#f59e0b]">{data.byCategory.property}</div>
            <div className="text-xs text-muted-foreground">Property</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#3b82f6]">{data.byCategory.other}</div>
            <div className="text-xs text-muted-foreground">Other</div>
          </div>
        </div>

        {/* Neighborhood Breakdown */}
        {data.neighborhoodRanking.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Top Neighborhoods
            </h3>
            <div className="space-y-2">
              {data.neighborhoodRanking.map(([name, count], index) => (
                <div 
                  key={name} 
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {index + 1}. {name}
                  </span>
                  <span className="font-medium text-card-foreground">
                    {count} incident{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notable Incidents */}
        {data.notableIncidents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Notable Incidents
            </h3>
            <div className="space-y-3">
              {data.notableIncidents.map((incident) => (
                <div 
                  key={incident.id}
                  className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg"
                >
                  <div className="font-medium text-sm text-card-foreground">
                    {incident.incident_type}
                  </div>
                  {incident.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 {incident.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.total === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-muted-foreground">No incidents reported for this date</p>
          </div>
        )}
      </div>
    </div>
  );
}
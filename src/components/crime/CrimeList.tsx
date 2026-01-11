import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Package, HelpCircle, MapPin, Clock } from 'lucide-react';
import { CrimeIncident } from '@/hooks/useCrimeData';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CrimeListProps {
  incidents: CrimeIncident[];
  isLoading?: boolean;
  onIncidentClick?: (incident: CrimeIncident) => void;
  selectedId?: string;
  className?: string;
}

const CATEGORY_CONFIG = {
  violent: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  property: {
    icon: Package,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  other: {
    icon: HelpCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

function formatAddress(address: string | null): string {
  if (!address) return 'Address not available';
  // Convert "1234 Main St" to "1200 block of Main St" for privacy
  const match = address.match(/^(\d+)\s+(.+)/);
  if (match) {
    const blockNum = Math.floor(parseInt(match[1]) / 100) * 100;
    return `${blockNum} block of ${match[2]}`;
  }
  return address;
}

export function CrimeList({ 
  incidents, 
  isLoading, 
  onIncidentClick, 
  selectedId,
  className 
}: CrimeListProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 shadow-card">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="font-semibold text-card-foreground mb-1">No incidents found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or time period
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {incidents.map(incident => {
        const category = incident.incident_category || 'other';
        const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
        const Icon = config.icon;
        const isSelected = selectedId === incident.id;

        return (
          <button
            key={incident.id}
            onClick={() => onIncidentClick?.(incident)}
            className={cn(
              'w-full text-left bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-200 border-2',
              isSelected ? 'border-primary' : 'border-transparent hover:border-border'
            )}
          >
            <div className="flex gap-3">
              <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
                <Icon className={cn('w-5 h-5', config.color)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-card-foreground line-clamp-1">
                    {incident.incident_type}
                  </h4>
                  <span className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0',
                    config.bg,
                    config.color
                  )}>
                    {category}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formatAddress(incident.address)}</span>
                </div>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {incident.occurred_at 
                      ? formatDistanceToNow(new Date(incident.occurred_at), { addSuffix: true })
                      : 'Unknown time'}
                  </span>
                  {incident.zone && (
                    <span className="bg-muted px-2 py-0.5 rounded text-[10px]">
                      Zone {incident.zone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
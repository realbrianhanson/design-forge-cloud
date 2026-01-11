import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRelatedCrimeIncident } from '@/hooks/useCrimeIntegration';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RelatedIncidentCardProps {
  incidentId: string;
  className?: string;
}

const CATEGORY_COLORS = {
  violent: '#ef4444',
  property: '#f59e0b',
  other: '#3b82f6',
};

export function RelatedIncidentCard({ incidentId, className }: RelatedIncidentCardProps) {
  const { data: incident, isLoading } = useRelatedCrimeIncident(incidentId);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load mini-map if coordinates available
  useEffect(() => {
    if (!incident?.latitude || !incident?.longitude || !mapRef.current) return;

    const loadMap = async () => {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      const L = await import('leaflet');
      
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      }).setView([incident.latitude, incident.longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const category = incident.incident_category || 'other';
      const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

      const icon = L.divIcon({
        className: 'crime-marker',
        html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([incident.latitude, incident.longitude], { icon }).addTo(map);
      setMapLoaded(true);

      return () => map.remove();
    };

    loadMap();
  }, [incident]);

  if (isLoading) {
    return (
      <div className={cn('bg-muted/50 rounded-xl p-4', className)}>
        <Skeleton className="h-32 w-full mb-3 rounded-lg" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!incident) return null;

  const category = incident.incident_category || 'other';
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

  return (
    <div className={cn('bg-muted/50 rounded-xl overflow-hidden', className)}>
      {/* Mini Map */}
      {incident.latitude && incident.longitude && (
        <div 
          ref={mapRef} 
          className="h-32 w-full bg-muted"
          style={{ minHeight: '128px' }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span 
              className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full mb-1"
              style={{ 
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {category} Crime
            </span>
            <h4 className="font-semibold text-card-foreground">
              {incident.incident_type}
            </h4>
          </div>
        </div>

        {incident.address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {incident.address}
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-3">
          {incident.occurred_at 
            ? formatDistanceToNow(new Date(incident.occurred_at), { addSuffix: true })
            : 'Date unknown'}
        </p>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/crime?incident=${incident.id}`}>
            <ExternalLink className="w-3 h-3 mr-1.5" />
            View on Crime Map
          </Link>
        </Button>
      </div>
    </div>
  );
}
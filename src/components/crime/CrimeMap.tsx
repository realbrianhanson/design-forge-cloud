import { useEffect, useRef, useState } from 'react';
import { CrimeIncident } from '@/hooks/useCrimeData';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS = {
  violent: '#ef4444',
  property: '#f59e0b',
  other: '#3b82f6',
};

const JACKSONVILLE_CENTER: [number, number] = [30.3322, -81.6557];
const DEFAULT_ZOOM = 11;

interface CrimeMapProps {
  incidents: CrimeIncident[];
  isLoading?: boolean;
  selectedIncident?: CrimeIncident | null;
  onIncidentClick?: (incident: CrimeIncident) => void;
}

function formatAddress(address: string | null): string {
  if (!address) return 'Address not available';
  const match = address.match(/^(\d+)\s+(.+)/);
  if (match) {
    const blockNum = Math.floor(parseInt(match[1]) / 100) * 100;
    return `${blockNum} block of ${match[2]}`;
  }
  return address;
}

export function CrimeMap({ incidents, isLoading, onIncidentClick }: CrimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        // Import CSS
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCss);

        // Import JS
        const L = await import('leaflet');
        (window as unknown as { L: typeof L }).L = L;
        setLeafletLoaded(true);
      }
    };
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstance) return;

    const L = (window as unknown as { L: typeof import('leaflet') }).L;
    
    const map = L.map(mapRef.current).setView(JACKSONVILLE_CENTER, DEFAULT_ZOOM);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, [leafletLoaded]);

  // Add markers
  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return;

    const L = (window as unknown as { L: typeof import('leaflet') }).L;
    
    // Clear existing markers
    mapInstance.eachLayer((layer) => {
      if ((layer as L.Marker).getLatLng) {
        mapInstance.removeLayer(layer);
      }
    });

    // Re-add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    // Add incident markers
    incidents.forEach((incident) => {
      if (incident.latitude && incident.longitude) {
        const category = incident.incident_category || 'other';
        const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other;
        
        const icon = L.divIcon({
          className: 'crime-marker',
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([incident.latitude, incident.longitude], { icon });
        
        const timeAgo = incident.occurred_at 
          ? formatDistanceToNow(new Date(incident.occurred_at), { addSuffix: true })
          : 'Unknown time';

        marker.bindPopup(`
          <div style="min-width: 180px;">
            <strong style="color: ${color};">${incident.incident_type}</strong>
            <p style="margin: 4px 0; font-size: 12px;">📍 ${formatAddress(incident.address)}</p>
            <p style="margin: 0; font-size: 11px; color: #666;">🕐 ${timeAgo}</p>
          </div>
        `);

        marker.on('click', () => onIncidentClick?.(incident));
        marker.addTo(mapInstance);
      }
    });
  }, [mapInstance, incidents, leafletLoaded, onIncidentClick]);

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] bg-muted flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 z-[1000] flex items-center justify-center">
          <div className="bg-card rounded-lg p-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading incidents...</span>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <h4 className="text-xs font-semibold text-card-foreground mb-2">Legend</h4>
        <div className="space-y-1.5">
          {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
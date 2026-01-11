import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface EventMapViewProps {
  events: Tables<'events'>[];
  isLoading?: boolean;
}

// Category marker colors
const CATEGORY_COLORS: Record<string, string> = {
  music: '#8b5cf6',
  sports: '#f97316',
  family: '#3b82f6',
  food: '#f43f5e',
  arts: '#ec4899',
  community: '#14b8a6',
  business: '#10b981',
  nightlife: '#6366f1',
  government: '#6b7280',
};

// Create colored marker icons
const createMarkerIcon = (category: string) => {
  const color = CATEGORY_COLORS[category] || '#6b7280';
  
  return L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const EventMapView = ({ events, isLoading }: EventMapViewProps) => {
  // Filter events with location coordinates
  // For now, we'll use placeholder coordinates based on Jacksonville areas
  // In production, you'd geocode the addresses
  const eventsWithCoords = useMemo(() => {
    return events.filter(e => e.location_address || e.location_name).map(event => {
      // Placeholder: distribute events around Jacksonville
      // In production, use actual geocoded coordinates
      const baseLatitude = 30.3322;
      const baseLongitude = -81.6557;
      const jitter = () => (Math.random() - 0.5) * 0.1;
      
      return {
        ...event,
        latitude: baseLatitude + jitter(),
        longitude: baseLongitude + jitter(),
      };
    });
  }, [events]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (eventsWithCoords.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-card h-[500px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No events with locations to display</p>
        </div>
      </div>
    );
  }

  // Center on Jacksonville
  const center: [number, number] = [30.3322, -81.6557];

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {eventsWithCoords.map(event => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createMarkerIcon(event.category)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(event.start_time), 'EEE, MMM d · h:mm a')}
                </div>
                {event.location_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    {event.location_name}
                  </div>
                )}
                <Link to={`/events/${event.slug || event.id}`}>
                  <Button size="sm" className="w-full text-xs h-7">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Category Legend */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

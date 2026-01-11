import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { useWeatherAlerts, getAlertStyles } from '@/hooks/useWeather';
import { useState } from 'react';

export function WeatherAlertBanner() {
  const { data: alerts } = useWeatherAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filter to only severe/extreme alerts and exclude dismissed
  const severeAlerts = alerts?.filter(
    alert => 
      (alert.severity === 'severe' || alert.severity === 'extreme') &&
      !dismissed.has(alert.id)
  ) || [];

  if (severeAlerts.length === 0) return null;

  const alert = severeAlerts[0]; // Show most severe first
  const isExtreme = alert.severity === 'extreme';
  const canDismiss = !isExtreme; // Can't dismiss extreme alerts

  return (
    <div 
      className={`
        relative w-full py-2.5 px-4
        ${isExtreme 
          ? 'bg-gradient-to-r from-destructive to-destructive/90 animate-pulse-subtle' 
          : 'bg-gradient-to-r from-warning to-warning/90'
        }
        text-white
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="container-news flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce-subtle" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-bold uppercase text-sm tracking-wide flex-shrink-0">
              {alert.event}:
            </span>
            <span className="truncate text-sm font-medium">
              {alert.headline || alert.description?.slice(0, 100)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link 
            to="/weather#alerts"
            className="flex items-center gap-1 text-sm font-medium hover:underline underline-offset-2"
          >
            Learn More
            <ChevronRight className="w-4 h-4" />
          </Link>
          
          {severeAlerts.length > 1 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              +{severeAlerts.length - 1} more
            </span>
          )}

          {canDismiss && (
            <button
              onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

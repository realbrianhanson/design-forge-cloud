import { Waves, Sun, Thermometer, AlertTriangle, Wind, Sunrise, Sunset } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BeachConditionsProps {
  variant?: 'compact' | 'full';
}

// Placeholder data - in production this would come from NWS marine forecast or NOAA buoys
const BEACH_DATA = {
  location: 'Jacksonville Beach',
  waterTemp: 72,
  surfHeight: '2-3 ft',
  ripCurrentRisk: 'low' as const,
  uvIndex: 7,
  uvLevel: 'High' as const,
  wind: 'NE 10-15 mph',
  sunrise: '7:22 AM',
  sunset: '5:42 PM',
  beachFlags: 'yellow' as const,
};

const RIP_CURRENT_COLORS = {
  low: 'bg-success text-success-foreground',
  moderate: 'bg-warning text-warning-foreground',
  high: 'bg-destructive text-destructive-foreground',
};

const UV_COLORS = {
  Low: 'bg-success text-success-foreground',
  Moderate: 'bg-warning/70 text-foreground',
  High: 'bg-warning text-warning-foreground',
  'Very High': 'bg-destructive/80 text-destructive-foreground',
  Extreme: 'bg-destructive text-destructive-foreground',
};

const FLAG_INFO = {
  green: { color: 'bg-success', label: 'Calm conditions', icon: '🟢' },
  yellow: { color: 'bg-warning', label: 'Moderate conditions', icon: '🟡' },
  red: { color: 'bg-destructive', label: 'Dangerous conditions', icon: '🔴' },
  'double-red': { color: 'bg-destructive', label: 'Water closed', icon: '🔴🔴' },
  purple: { color: 'bg-purple-600', label: 'Dangerous marine life', icon: '🟣' },
};

export function BeachConditions({ variant = 'full' }: BeachConditionsProps) {
  const data = BEACH_DATA;
  const flagInfo = FLAG_INFO[data.beachFlags];

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-accent" />
              <span className="font-medium text-foreground">Beach</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {data.waterTemp}°F • {data.surfHeight}
              </span>
              <Badge className={RIP_CURRENT_COLORS[data.ripCurrentRisk]}>
                {data.ripCurrentRisk} rip
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-accent" />
            {data.location}
          </span>
          <Badge className={flagInfo.color}>
            {flagInfo.icon} {flagInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Thermometer className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs text-muted-foreground">Water Temp</p>
            <p className="text-lg font-semibold text-foreground">{data.waterTemp}°F</p>
          </div>
          
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Waves className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs text-muted-foreground">Surf Height</p>
            <p className="text-lg font-semibold text-foreground">{data.surfHeight}</p>
          </div>
          
          <div className="bg-secondary rounded-lg p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs text-muted-foreground">Rip Current</p>
            <Badge className={`${RIP_CURRENT_COLORS[data.ripCurrentRisk]} mt-1`}>
              {data.ripCurrentRisk.charAt(0).toUpperCase() + data.ripCurrentRisk.slice(1)}
            </Badge>
          </div>
          
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Sun className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs text-muted-foreground">UV Index</p>
            <Badge className={`${UV_COLORS[data.uvLevel]} mt-1`}>
              {data.uvIndex} - {data.uvLevel}
            </Badge>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wind className="w-4 h-4" />
              {data.wind}
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sunrise className="w-4 h-4" />
              {data.sunrise}
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="w-4 h-4" />
              {data.sunset}
            </span>
          </div>
        </div>

        {/* Safety Notice */}
        {data.ripCurrentRisk !== 'low' && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
            <p className="font-medium text-warning flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rip Current Advisory
            </p>
            <p className="text-muted-foreground mt-1">
              Stay out of the water if you're not a strong swimmer. If caught in a rip current, 
              swim parallel to shore until free.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

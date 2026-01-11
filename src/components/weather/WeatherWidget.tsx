import { Link } from 'react-router-dom';
import { Cloud, Droplets, Wind, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  useCurrentWeather, 
  useWeatherForecast, 
  useWeatherAlerts,
  getWeatherEmoji,
  getAlertStyles,
  WeatherForecast 
} from '@/hooks/useWeather';
import { format, parseISO } from 'date-fns';

interface WeatherWidgetProps {
  variant?: 'compact' | 'full' | 'hero';
  showForecast?: boolean;
  showAlerts?: boolean;
}

export function WeatherWidget({ 
  variant = 'full', 
  showForecast = variant !== 'compact',
  showAlerts = true 
}: WeatherWidgetProps) {
  const { data: current, isLoading: loadingCurrent } = useCurrentWeather();
  const { data: forecast, isLoading: loadingForecast } = useWeatherForecast('jacksonville', variant === 'hero' ? 14 : 10);
  const { data: alerts } = useWeatherAlerts();

  if (loadingCurrent) {
    return <WeatherSkeleton variant={variant} />;
  }

  if (!current) {
    return null;
  }

  // Get daytime forecasts for 5-day view
  const dailyForecasts = forecast?.filter(f => f.is_daytime).slice(0, variant === 'hero' ? 7 : 5) || [];

  if (variant === 'compact') {
    return (
      <CompactWeather 
        current={current} 
        alerts={showAlerts ? alerts : undefined}
      />
    );
  }

  if (variant === 'hero') {
    return (
      <HeroWeather 
        current={current} 
        forecast={forecast || []}
        dailyForecasts={dailyForecasts}
        alerts={showAlerts ? alerts : undefined}
      />
    );
  }

  return (
    <FullWeather 
      current={current} 
      dailyForecasts={showForecast ? dailyForecasts : []}
      alerts={showAlerts ? alerts : undefined}
    />
  );
}

// Compact variant for header
function CompactWeather({ 
  current, 
  alerts 
}: { 
  current: any; 
  alerts?: any[] 
}) {
  const hasAlerts = alerts && alerts.length > 0;
  
  return (
    <Link 
      to="/weather" 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
    >
      <span className="text-xl" aria-hidden="true">
        {getWeatherEmoji(current.conditions)}
      </span>
      <span className="font-semibold text-foreground">
        {current.temperature_f}°F
      </span>
      <span className="text-muted-foreground text-sm hidden sm:inline">
        {current.conditions}
      </span>
      {hasAlerts && (
        <AlertTriangle className="w-4 h-4 text-warning animate-pulse-subtle" />
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// Full variant for sidebar
function FullWeather({ 
  current, 
  dailyForecasts,
  alerts 
}: { 
  current: any; 
  dailyForecasts: WeatherForecast[];
  alerts?: any[] 
}) {
  return (
    <Card className="bg-card shadow-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-accent" />
            Jacksonville Weather
          </span>
          <Link to="/weather" className="text-sm text-accent hover:text-accent/80 font-normal">
            Full Forecast →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Alerts */}
        {alerts && alerts.length > 0 && (
          <AlertBanner alerts={alerts} />
        )}

        {/* Current Conditions */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{getWeatherEmoji(current.conditions)}</span>
              <div>
                <p className="text-4xl font-semibold text-foreground">
                  {current.temperature_f}°
                </p>
                <p className="text-muted-foreground">
                  {current.conditions}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1 justify-end">
              Feels like {current.feels_like_f}°
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Droplets className="w-3 h-3" />
              {current.humidity}%
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Wind className="w-3 h-3" />
              {current.wind_direction} {current.wind_speed}
            </p>
          </div>
        </div>

        {/* 5-Day Forecast */}
        {dailyForecasts.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              {dailyForecasts.map((day) => (
                <ForecastDay key={day.id} forecast={day} />
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        {current.updated_at && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Updated {format(parseISO(current.updated_at), 'h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Hero variant for weather page
function HeroWeather({ 
  current, 
  forecast,
  dailyForecasts,
  alerts 
}: { 
  current: any;
  forecast: WeatherForecast[];
  dailyForecasts: WeatherForecast[];
  alerts?: any[] 
}) {
  // Get hourly forecast (next 12 periods)
  const hourlyForecast = forecast.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Main Current Weather Card */}
      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="weather-pattern" />
        </div>
        <CardContent className="pt-8 pb-6 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <span className="text-8xl md:text-9xl animate-bounce-subtle">
                {getWeatherEmoji(current.conditions)}
              </span>
              <div>
                <p className="text-6xl md:text-7xl font-bold text-foreground">
                  {current.temperature_f}°F
                </p>
                <p className="text-xl md:text-2xl text-muted-foreground mt-1">
                  {current.conditions}
                </p>
                <p className="text-muted-foreground">
                  Jacksonville, FL
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:gap-6 text-center md:text-right">
              <div className="bg-background/60 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Feels Like</p>
                <p className="text-2xl font-semibold text-foreground">
                  {current.feels_like_f}°
                </p>
              </div>
              <div className="bg-background/60 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="text-2xl font-semibold text-foreground flex items-center justify-center md:justify-end gap-1">
                  <Droplets className="w-5 h-5 text-accent" />
                  {current.humidity}%
                </p>
              </div>
              <div className="bg-background/60 rounded-lg p-3 col-span-2">
                <p className="text-sm text-muted-foreground">Wind</p>
                <p className="text-2xl font-semibold text-foreground flex items-center justify-center md:justify-end gap-1">
                  <Wind className="w-5 h-5 text-accent" />
                  {current.wind_direction} {current.wind_speed}
                </p>
              </div>
            </div>
          </div>

          {current.updated_at && (
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Last updated: {format(parseISO(current.updated_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hourly Forecast */}
      {hourlyForecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hourly Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {hourlyForecast.map((period) => (
                <div 
                  key={period.id} 
                  className="flex-shrink-0 text-center p-3 rounded-lg bg-secondary/50 min-w-[80px]"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {period.period_name.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <span className="text-2xl block mb-1">
                    {getWeatherEmoji(period.conditions)}
                  </span>
                  <p className="font-semibold text-foreground">
                    {period.temperature}°
                  </p>
                  {period.precipitation_chance !== null && period.precipitation_chance > 0 && (
                    <p className="text-xs text-accent">
                      {period.precipitation_chance}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Day Forecast */}
      {dailyForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">7-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyForecasts.map((day, index) => {
                // Find the corresponding night period
                const nightPeriod = forecast.find(
                  f => f.forecast_date === day.forecast_date && !f.is_daytime
                );
                
                return (
                  <div 
                    key={day.id} 
                    className={`flex items-center gap-4 py-3 ${
                      index !== dailyForecasts.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <p className="w-24 font-medium text-foreground">
                      {index === 0 ? 'Today' : day.period_name.split(' ')[0]}
                    </p>
                    <span className="text-2xl w-10 text-center">
                      {getWeatherEmoji(day.conditions)}
                    </span>
                    <div className="flex-1">
                      <p className="text-foreground">{day.conditions}</p>
                      {day.precipitation_chance !== null && day.precipitation_chance > 0 && (
                        <p className="text-sm text-accent flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {day.precipitation_chance}% chance of rain
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        {day.temperature}°
                      </span>
                      {nightPeriod && (
                        <span className="text-muted-foreground ml-2">
                          / {nightPeriod.temperature}°
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Forecast day component
function ForecastDay({ forecast }: { forecast: WeatherForecast }) {
  const dayName = forecast.period_name.split(' ')[0];
  
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-muted-foreground font-medium">
        {dayName.slice(0, 3)}
      </p>
      <span className="text-xl">{getWeatherEmoji(forecast.conditions)}</span>
      <p className="text-sm font-medium text-foreground">
        {forecast.temperature}°
      </p>
      {forecast.precipitation_chance !== null && forecast.precipitation_chance > 0 && (
        <p className="text-xs text-accent">
          {forecast.precipitation_chance}%
        </p>
      )}
    </div>
  );
}

// Alert banner for sidebar widget
function AlertBanner({ alerts }: { alerts: any[] }) {
  const alert = alerts[0]; // Show most severe
  const styles = getAlertStyles(alert.severity);
  
  return (
    <Link 
      to="/weather#alerts"
      className={`block ${styles.bg} ${styles.text} rounded-lg p-3 ${
        alert.severity === 'extreme' ? 'animate-pulse-subtle' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <p className="font-medium text-sm line-clamp-1">{alert.event}</p>
      </div>
      {alerts.length > 1 && (
        <p className="text-xs mt-1 opacity-90">
          +{alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''}
        </p>
      )}
    </Link>
  );
}

// Full alert card for hero/page view
function AlertCard({ alert }: { alert: any }) {
  const styles = getAlertStyles(alert.severity);
  
  return (
    <Card className={`${styles.bg} ${styles.text} border-0 ${
      alert.severity === 'extreme' ? 'animate-pulse-subtle' : ''
    }`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{alert.event}</h3>
              <Badge variant="outline" className={`${styles.text} border-current`}>
                {alert.severity}
              </Badge>
            </div>
            {alert.headline && (
              <p className="font-medium mb-2">{alert.headline}</p>
            )}
            {alert.instruction && (
              <p className="text-sm opacity-90 mb-2">{alert.instruction}</p>
            )}
            <div className="flex items-center gap-4 text-sm opacity-80">
              {alert.effective_at && (
                <span>Effective: {format(parseISO(alert.effective_at), 'MMM d, h:mm a')}</span>
              )}
              {alert.expires_at && (
                <span>Expires: {format(parseISO(alert.expires_at), 'MMM d, h:mm a')}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function WeatherSkeleton({ variant }: { variant: string }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-12 h-5" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div>
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

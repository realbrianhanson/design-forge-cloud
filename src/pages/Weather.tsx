import { ExternalLink, Radio, Waves, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Layout } from '@/components/layout/Layout';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { useWeatherAlerts } from '@/hooks/useWeather';

export default function Weather() {
  const { data: alerts } = useWeatherAlerts();
  const currentMonth = new Date().getMonth();
  const isHurricaneSeason = currentMonth >= 5 && currentMonth <= 10; // June-November

  return (
    <Layout>
      <SEO 
        title="Jacksonville Weather - Current Conditions & Forecast"
        description="Current weather conditions, 7-day forecast, and severe weather alerts for Jacksonville, Florida."
      />
      
      <div className="container-news py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <header>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Jacksonville Weather
              </h1>
              <p className="text-muted-foreground">
                Current conditions and forecast from the National Weather Service
              </p>
            </header>

            {/* Hero Weather Widget */}
            <WeatherWidget variant="hero" showAlerts={true} showForecast={true} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Radar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Radio className="w-5 h-5 text-accent" />
                  Weather Radar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                  <img 
                    src="https://radar.weather.gov/ridge/standard/KJAX_loop.gif"
                    alt="Jacksonville Weather Radar"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a 
                    href="https://radar.weather.gov/?settings=v1_eyJhZ2VuZGEiOnsiaWQiOiJsb2NhbCIsImNlbnRlciI6Wy04MS42NTYsMzAuMzMyXSwiem9vbSI6OH19"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Full Interactive Radar
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Beach Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Waves className="w-5 h-5 text-accent" />
                  Beach Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Jacksonville Beach, FL
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground">Surf Height</p>
                    <p className="font-semibold text-foreground">2-3 ft</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground">Water Temp</p>
                    <p className="font-semibold text-foreground">72°F</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground">UV Index</p>
                    <p className="font-semibold text-foreground">High (7)</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground">Rip Current</p>
                    <p className="font-semibold text-foreground">Low</p>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <a 
                    href="https://www.weather.gov/jax/surfzone"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Full Beach Forecast
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Hurricane Season Section */}
            {isHurricaneSeason && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warning">
                    <AlertTriangle className="w-5 h-5" />
                    Hurricane Season
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Atlantic hurricane season runs June 1 - November 30. Stay prepared and monitor tropical developments.
                  </p>
                  
                  <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <a 
                        href="https://www.nhc.noaa.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        National Hurricane Center
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a 
                        href="https://www.weather.gov/jax/tropics"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        NWS Jacksonville Tropics
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weather Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="https://www.weather.gov/jax/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      NWS Jacksonville
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://alerts.weather.gov/cap/fl.php?x=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Florida Weather Alerts
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.coj.net/departments/fire-and-rescue/divisions/emergency-preparedness"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Jacksonville Emergency Preparedness
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

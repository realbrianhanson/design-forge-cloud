import { ExternalLink, AlertTriangle, MapPin, CheckCircle2, Phone, Radio, Zap, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Layout } from '@/components/layout/Layout';
import { useWeatherAlerts } from '@/hooks/useWeather';
import { format } from 'date-fns';

const EVACUATION_ZONES = [
  { zone: 'A', description: 'Barrier islands, low-lying coastal areas', risk: 'Highest' },
  { zone: 'B', description: 'Adjacent to Zone A, slightly higher elevation', risk: 'High' },
  { zone: 'C', description: 'Further inland, moderate flood risk', risk: 'Moderate' },
];

const EMERGENCY_CONTACTS = [
  { name: 'JaxReady', phone: '904-630-CITY', url: 'https://www.jaxready.com', icon: AlertTriangle },
  { name: 'JSO Emergency', phone: '904-630-0500', url: 'https://www.jaxsheriff.org', icon: Phone },
  { name: 'JEA Outages', phone: '904-665-6000', url: 'https://www.jea.com/outages', icon: Zap },
  { name: 'Red Cross', phone: '1-800-RED-CROSS', url: 'https://www.redcross.org', icon: Home },
];

const PREPARATION_CHECKLIST = [
  { category: 'Documents', items: ['ID/Passport', 'Insurance papers', 'Medical records', 'Bank info'] },
  { category: 'Supplies', items: ['Water (1 gal/person/day)', 'Non-perishable food', 'Medications', 'First aid kit'] },
  { category: 'Equipment', items: ['Flashlights & batteries', 'Portable radio', 'Phone chargers', 'Cash'] },
  { category: 'Home Prep', items: ['Board up windows', 'Secure outdoor items', 'Fill vehicles with gas', 'Know your zone'] },
];

export default function HurricaneCentral() {
  const { data: alerts } = useWeatherAlerts();
  
  // Filter for tropical/hurricane related alerts
  const tropicalAlerts = alerts?.filter(alert => 
    alert.event.toLowerCase().includes('hurricane') ||
    alert.event.toLowerCase().includes('tropical') ||
    alert.event.toLowerCase().includes('storm surge')
  ) || [];

  const currentMonth = new Date().getMonth();
  const isHurricaneSeason = currentMonth >= 5 && currentMonth <= 10;
  const seasonProgress = isHurricaneSeason 
    ? Math.round(((currentMonth - 5) / 6) * 100)
    : 0;

  return (
    <Layout>
      <SEO 
        title="Hurricane Central - Jacksonville Storm Tracking & Preparedness"
        description="Track Atlantic hurricanes, find your evacuation zone, and prepare for storms in Jacksonville, FL. Live updates and emergency resources."
      />
      
      <div className="container-news py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="text-center mb-8">
            <Badge className="mb-4 bg-warning text-warning-foreground">
              Hurricane Season: June 1 - November 30
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              🌀 Hurricane Central
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stay informed and prepared for tropical weather in Jacksonville. 
              Track storms, find your evacuation zone, and access emergency resources.
            </p>
          </header>

          {/* Active Tropical Alerts */}
          {tropicalAlerts.length > 0 && (
            <div className="mb-8 space-y-4">
              {tropicalAlerts.map(alert => (
                <Card 
                  key={alert.id}
                  className="bg-destructive text-destructive-foreground border-0 animate-pulse-subtle"
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-xl">{alert.event}</h3>
                        {alert.headline && (
                          <p className="font-medium mt-1">{alert.headline}</p>
                        )}
                        {alert.instruction && (
                          <p className="mt-2 text-sm opacity-90">{alert.instruction}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Atlantic Basin Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-accent" />
                    Atlantic Storm Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                    <img 
                      src="https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png"
                      alt="5-Day Atlantic Tropical Outlook"
                      className="w-full h-full object-contain bg-primary/5"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    5-Day Atlantic Tropical Outlook • Source: National Hurricane Center
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button asChild variant="default">
                      <a 
                        href="https://www.nhc.noaa.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        National Hurricane Center
                      </a>
                    </Button>
                    <Button asChild variant="outline">
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

              {/* Evacuation Zones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Jacksonville Evacuation Zones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Know your zone before a storm threatens. Different zones evacuate based on storm 
                    strength and expected surge.
                  </p>
                  
                  <div className="space-y-3">
                    {EVACUATION_ZONES.map(zone => (
                      <div 
                        key={zone.zone}
                        className="flex items-center gap-4 p-3 bg-secondary rounded-lg"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                          {zone.zone}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{zone.description}</p>
                          <p className="text-sm text-muted-foreground">Risk Level: {zone.risk}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button asChild className="w-full" variant="default">
                    <a 
                      href="https://maps.coj.net/knowyourzone/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Find Your Evacuation Zone
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Preparation Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    Hurricane Preparation Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PREPARATION_CHECKLIST.map(category => (
                      <div key={category.category} className="space-y-2">
                        <h4 className="font-medium text-foreground">{category.category}</h4>
                        <ul className="space-y-1">
                          {category.items.map(item => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Season Status */}
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {isHurricaneSeason ? 'Hurricane Season Active' : 'Hurricane Season'}
                    </p>
                    <p className="text-3xl font-bold text-primary mb-3">
                      {format(new Date(), 'MMMM d, yyyy')}
                    </p>
                    {isHurricaneSeason && (
                      <div className="space-y-1">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent transition-all"
                            style={{ width: `${seasonProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {seasonProgress}% of season complete
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {EMERGENCY_CONTACTS.map(contact => (
                    <a
                      key={contact.name}
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <contact.icon className="w-5 h-5 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>

              {/* Storm Shelters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Storm Shelters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Public shelters open when a storm threatens. Check JaxReady for current shelter locations.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a 
                      href="https://www.jaxready.com/Shelter-Map"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Find Shelters
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Weather Radio */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Radio className="w-5 h-5 text-accent" />
                    NOAA Weather Radio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tune in for 24/7 weather updates and emergency alerts.
                  </p>
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">162.475 MHz</p>
                    <p className="text-sm text-muted-foreground">KHB33 Jacksonville</p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}

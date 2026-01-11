import { useState } from 'react';
import { Map, List, Menu, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CrimeMap } from '@/components/crime/CrimeMap';
import { CrimeFilters } from '@/components/crime/CrimeFilters';
import { CrimeStatsBar } from '@/components/crime/CrimeStatsBar';
import { CrimeList } from '@/components/crime/CrimeList';
import { 
  useCrimeIncidents, 
  useCrimeStats, 
  useCrimeIncidentTypes,
  CrimeFilters as CrimeFiltersType,
  CrimeIncident
} from '@/hooks/useCrimeData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DATE_RANGE_LABELS = {
  day: 'Last 24 Hours',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  custom: 'Custom Range',
};

const CrimeMapPage = () => {
  const isMobile = useIsMobile();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedIncident, setSelectedIncident] = useState<CrimeIncident | null>(null);
  
  const [filters, setFilters] = useState<CrimeFiltersType>({
    dateRange: 'week',
    categories: ['violent', 'property', 'other'],
    incidentTypes: [],
  });

  const { data: incidents = [], isLoading: incidentsLoading } = useCrimeIncidents(filters);
  const { data: stats, isLoading: statsLoading } = useCrimeStats(filters);
  const { data: incidentTypes = [] } = useCrimeIncidentTypes();

  const handleIncidentClick = (incident: CrimeIncident) => {
    setSelectedIncident(incident);
  };

  // Mobile layout with bottom sheet for filters
  if (isMobile) {
    return (
      <Layout hideFooter>
        <SEO 
          title="Crime Map"
          description="Interactive crime map of Jacksonville. View recent incidents, filter by type, and explore neighborhood safety data."
          url="/crime"
        />
        
        <div className="flex flex-col h-[calc(100vh-56px)]">
          {/* Stats Bar */}
          <CrimeStatsBar 
            stats={stats}
            isLoading={statsLoading}
            dateRangeLabel={DATE_RANGE_LABELS[filters.dateRange]}
            className="rounded-none border-b"
          />

          {/* View Toggle + Filter Button */}
          <div className="flex items-center justify-between px-4 py-2 bg-background border-b">
            <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
              <TabsList className="h-9">
                <TabsTrigger value="map" className="px-3">
                  <Map className="w-4 h-4 mr-1.5" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                  <List className="w-4 h-4 mr-1.5" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="w-4 h-4 mr-1.5" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <CrimeFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  incidentTypes={incidentTypes}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {view === 'map' ? (
              <CrimeMap
                incidents={incidents}
                isLoading={incidentsLoading}
                onIncidentClick={handleIncidentClick}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4">
                <CrimeList
                  incidents={incidents}
                  isLoading={incidentsLoading}
                  onIncidentClick={handleIncidentClick}
                  selectedId={selectedIncident?.id}
                />
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Desktop layout with sidebar
  return (
    <Layout hideFooter>
      <SEO 
        title="Crime Map"
        description="Interactive crime map of Jacksonville. View recent incidents, filter by type, and explore neighborhood safety data."
        url="/crime"
      />
      
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Stats Bar */}
        <CrimeStatsBar 
          stats={stats}
          isLoading={statsLoading}
          dateRangeLabel={DATE_RANGE_LABELS[filters.dateRange]}
          className="rounded-none border-b mx-0"
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div 
            className={cn(
              'bg-card border-r transition-all duration-300 overflow-hidden flex flex-col',
              sidebarOpen ? 'w-80' : 'w-0'
            )}
          >
            {sidebarOpen && (
              <>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
                    <TabsList className="h-9">
                      <TabsTrigger value="map" className="px-3">
                        <Map className="w-4 h-4 mr-1.5" />
                        Map
                      </TabsTrigger>
                      <TabsTrigger value="list" className="px-3">
                        <List className="w-4 h-4 mr-1.5" />
                        List
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSidebarOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Filters */}
                <div className="border-b overflow-y-auto">
                  <CrimeFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    incidentTypes={incidentTypes}
                    isCollapsible
                  />
                </div>

                {/* List View in Sidebar */}
                {view === 'list' && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <CrimeList
                      incidents={incidents}
                      isLoading={incidentsLoading}
                      onIncidentClick={handleIncidentClick}
                      selectedId={selectedIncident?.id}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            {!sidebarOpen && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-[1000] shadow-lg"
              >
                <Menu className="w-4 h-4 mr-1.5" />
                Filters
              </Button>
            )}
            
            <CrimeMap
              incidents={incidents}
              isLoading={incidentsLoading}
              selectedIncident={selectedIncident}
              onIncidentClick={handleIncidentClick}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CrimeMapPage;
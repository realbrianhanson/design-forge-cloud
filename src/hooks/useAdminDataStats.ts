import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';

// Types for the admin data dashboard
export interface RssSourceStats {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  last_fetched_at: string | null;
  articles_count: number;
  articles_today: number;
}

export interface PipelineStats {
  pendingArticles: number;
  processingQueue: number;
  errorsToday: number;
  totalProcessed: number;
}

export interface CrimeStats {
  incidentsToday: number;
  last30Days: number;
  lastSync: string | null;
}

export interface WeatherStats {
  currentTemp: number | null;
  currentConditions: string | null;
  activeAlerts: number;
  lastUpdate: string | null;
}

export interface BusinessStats {
  totalBusinesses: number;
  pendingClaims: number;
  addedThisWeek: number;
  pendingReview: number;
}

export interface EventStats {
  totalEvents: number;
  pendingApproval: number;
  thisWeek: number;
  cityEvents: number;
  eventbriteEvents: number;
}

export interface ActionLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

// Fetch RSS sources with stats
export const useRssSourcesStats = () => {
  return useQuery({
    queryKey: ['admin-rss-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      
      const { data: sources, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get article counts for today for each source
      const statsPromises = (sources || []).map(async (source) => {
        const { count } = await supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('rss_source_id', source.id)
          .gte('created_at', today);

        return {
          ...source,
          articles_today: count || 0,
        } as RssSourceStats;
      });

      const sourcesWithStats = await Promise.all(statsPromises);
      
      const totalActive = sourcesWithStats.filter(s => s.is_active).length;
      const totalPaused = sourcesWithStats.filter(s => !s.is_active).length;
      const articlesToday = sourcesWithStats.reduce((sum, s) => sum + s.articles_today, 0);
      const lastFetch = sourcesWithStats
        .filter(s => s.last_fetched_at)
        .sort((a, b) => new Date(b.last_fetched_at!).getTime() - new Date(a.last_fetched_at!).getTime())[0]
        ?.last_fetched_at;

      return {
        sources: sourcesWithStats,
        totalSources: sourcesWithStats.length,
        totalActive,
        totalPaused,
        articlesToday,
        lastFetch,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Fetch pipeline stats
export const usePipelineStats = () => {
  return useQuery({
    queryKey: ['admin-pipeline-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();

      const [pending, errors, processed] = await Promise.all([
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('ai_processing_logs')
          .select('id', { count: 'exact', head: true })
          .eq('success', false)
          .gte('created_at', today),
        supabase
          .from('ai_processing_logs')
          .select('id', { count: 'exact', head: true })
          .eq('success', true)
          .gte('created_at', today),
      ]);

      return {
        pendingArticles: pending.count || 0,
        processingQueue: 0, // Would need real-time tracking
        errorsToday: errors.count || 0,
        totalProcessed: processed.count || 0,
      } as PipelineStats;
    },
    refetchInterval: 30000,
  });
};

// Fetch crime stats
export const useCrimeDataStats = () => {
  return useQuery({
    queryKey: ['admin-crime-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [todayIncidents, last30Days, lastIncident] = await Promise.all([
        supabase
          .from('crime_incidents')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase
          .from('crime_incidents')
          .select('id', { count: 'exact', head: true })
          .gte('occurred_at', thirtyDaysAgo),
        supabase
          .from('crime_incidents')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        incidentsToday: todayIncidents.count || 0,
        last30Days: last30Days.count || 0,
        lastSync: lastIncident?.data?.created_at || null,
      } as CrimeStats;
    },
    refetchInterval: 60000,
  });
};

// Fetch weather stats
export const useWeatherDataStats = () => {
  return useQuery({
    queryKey: ['admin-weather-stats'],
    queryFn: async () => {
      const [current, alerts] = await Promise.all([
        supabase
          .from('weather_current')
          .select('*')
          .eq('location', 'jacksonville')
          .maybeSingle(),
        supabase
          .from('weather_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      return {
        currentTemp: current.data?.temperature_f || null,
        currentConditions: current.data?.conditions || null,
        activeAlerts: alerts.count || 0,
        lastUpdate: current.data?.updated_at || null,
      } as WeatherStats;
    },
    refetchInterval: 60000,
  });
};

// Fetch business stats
export const useBusinessDataStats = () => {
  return useQuery({
    queryKey: ['admin-business-stats'],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();

      const [total, pendingClaims, addedThisWeek, pendingReview] = await Promise.all([
        supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('claimed', false)
          .not('claimed_by', 'is', null),
        supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo),
        supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      return {
        totalBusinesses: total.count || 0,
        pendingClaims: pendingClaims.count || 0,
        addedThisWeek: addedThisWeek.count || 0,
        pendingReview: pendingReview.count || 0,
      } as BusinessStats;
    },
    refetchInterval: 60000,
  });
};

// Fetch event stats
export const useEventDataStats = () => {
  return useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      const now = new Date().toISOString();
      const weekFromNow = subDays(new Date(), -7).toISOString();

      const [total, pending, thisWeek, cityEvents, eventbriteEvents] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('start_time', now),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('start_time', now)
          .lte('start_time', weekFromNow),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('source_type', 'city'),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('source_type', 'eventbrite'),
      ]);

      return {
        totalEvents: total.count || 0,
        pendingApproval: pending.count || 0,
        thisWeek: thisWeek.count || 0,
        cityEvents: cityEvents.count || 0,
        eventbriteEvents: eventbriteEvents.count || 0,
      } as EventStats;
    },
    refetchInterval: 60000,
  });
};

// Fetch recent action logs (simulated from various sources)
export const useActionLogs = () => {
  return useQuery({
    queryKey: ['admin-action-logs'],
    queryFn: async () => {
      const [aiLogs, cityImports] = await Promise.all([
        supabase
          .from('ai_processing_logs')
          .select('id, created_at, success, error_message, summary_result')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('city_event_imports')
          .select('*')
          .order('import_date', { ascending: false })
          .limit(5),
      ]);

      const logs: ActionLog[] = [];

      // Add AI processing logs
      aiLogs.data?.forEach((log) => {
        logs.push({
          id: `ai-${log.id}`,
          action: log.success ? 'AI processed article' : 'AI processing failed',
          details: log.success 
            ? 'Article processed successfully'
            : log.error_message || 'Unknown error',
          timestamp: log.created_at,
          status: log.success ? 'success' : 'error',
        });
      });

      // Add city event imports
      cityImports.data?.forEach((imp) => {
        logs.push({
          id: `city-${imp.id}`,
          action: 'City events imported',
          details: `${imp.events_created} created, ${imp.events_updated} updated, ${imp.events_skipped} skipped`,
          timestamp: imp.import_date,
          status: imp.success ? 'success' : 'error',
        });
      });

      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    },
    refetchInterval: 30000,
  });
};

// Mutations for triggering data operations
export const useDataOperations = () => {
  const queryClient = useQueryClient();

  const fetchRssMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('fetch-rss');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('RSS feeds fetched successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-rss-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to fetch RSS: ${error.message}`);
    },
  });

  const processArticlesMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('process-articles');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Articles processing started');
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to process articles: ${error.message}`);
    },
  });

  const fetchCrimeMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('fetch-crime-data');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Crime data fetched successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-crime-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to fetch crime data: ${error.message}`);
    },
  });

  const fetchWeatherMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('fetch-weather');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Weather data refreshed');
      queryClient.invalidateQueries({ queryKey: ['admin-weather-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to refresh weather: ${error.message}`);
    },
  });

  const fetchCityEventsMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('fetch-city-events');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('City events fetched successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to fetch city events: ${error.message}`);
    },
  });

  const fetchEventbriteMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('fetch-eventbrite-events');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Eventbrite events fetched successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to fetch Eventbrite events: ${error.message}`);
    },
  });

  const importBusinessesMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('import-businesses');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Business import started');
      queryClient.invalidateQueries({ queryKey: ['admin-business-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to import businesses: ${error.message}`);
    },
  });

  const runFullPipelineMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('daily-news-pipeline');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Full pipeline started');
      queryClient.invalidateQueries({ queryKey: ['admin-rss-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
    },
    onError: (error) => {
      toast.error(`Failed to run pipeline: ${error.message}`);
    },
  });

  return {
    fetchRss: fetchRssMutation,
    processArticles: processArticlesMutation,
    fetchCrime: fetchCrimeMutation,
    fetchWeather: fetchWeatherMutation,
    fetchCityEvents: fetchCityEventsMutation,
    fetchEventbrite: fetchEventbriteMutation,
    importBusinesses: importBusinessesMutation,
    runFullPipeline: runFullPipelineMutation,
  };
};

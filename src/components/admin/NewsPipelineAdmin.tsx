import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Rss, 
  Cpu, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Newspaper,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface RssSource {
  id: string;
  name: string;
  slug: string;
  feed_url: string;
  is_active: boolean;
  last_fetched_at: string | null;
  articles_count: number;
}

interface PipelineStats {
  pendingArticles: number;
  articlesProcessedToday: number;
  totalSources: number;
  activeSources: number;
  lastFetch: string | null;
}

export const NewsPipelineAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningAction, setRunningAction] = useState<string | null>(null);

  // Fetch pipeline stats
  const { data: stats, isLoading: statsLoading } = useQuery<PipelineStats>({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      const [pending, processed, sources] = await Promise.all([
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .is('ai_summary', null)
          .in('status', ['pending', 'active']),
        supabase
          .from('ai_processing_logs')
          .select('id', { count: 'exact', head: true })
          .eq('success', true)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase
          .from('rss_sources')
          .select('id, is_active, last_fetched_at')
          .order('last_fetched_at', { ascending: false }),
      ]);

      const lastFetch = sources.data?.[0]?.last_fetched_at || null;
      const activeSources = sources.data?.filter(s => s.is_active).length || 0;

      return {
        pendingArticles: pending.count || 0,
        articlesProcessedToday: processed.count || 0,
        totalSources: sources.data?.length || 0,
        activeSources,
        lastFetch,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch RSS sources
  const { data: sources, isLoading: sourcesLoading } = useQuery<RssSource[]>({
    queryKey: ['rss-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as RssSource[];
    },
  });

  // Mutation for fetch RSS
  const fetchRssMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-rss`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch RSS');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'RSS Fetch Complete',
        description: `Found ${data.summary?.total_articles_found || 0} articles, inserted ${data.summary?.total_articles_inserted || 0} new.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
    },
    onError: (error) => {
      toast({
        title: 'RSS Fetch Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSettled: () => setRunningAction(null),
  });

  // Mutation for process articles
  const processArticlesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-articles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ limit: 10 }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process articles');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Processing Complete',
        description: `Processed ${data.summary?.succeeded || 0} articles with AI.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSettled: () => setRunningAction(null),
  });

  // Mutation for full pipeline
  const fullPipelineMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-news-pipeline`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ process_limit: 15 }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Pipeline failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Pipeline Complete',
        description: `Fetched ${data.fetch_results?.articles_inserted || 0} articles, processed ${data.process_results?.succeeded || 0} with AI. Duration: ${data.duration_seconds}s`,
      });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
    },
    onError: (error) => {
      toast({
        title: 'Pipeline Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSettled: () => setRunningAction(null),
  });

  const handleFetchRss = () => {
    setRunningAction('fetch');
    fetchRssMutation.mutate();
  };

  const handleProcessArticles = () => {
    setRunningAction('process');
    processArticlesMutation.mutate();
  };

  const handleFullPipeline = () => {
    setRunningAction('pipeline');
    fullPipelineMutation.mutate();
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              News Pipeline
            </CardTitle>
            <CardDescription>
              Manage RSS feeds and AI article processing
            </CardDescription>
          </div>
          <Button
            onClick={handleFullPipeline}
            disabled={runningAction !== null}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {runningAction === 'pipeline' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Full Pipeline
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Pending Articles</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">
                {stats?.pendingArticles || 0}
              </p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Processed Today</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {stats?.articlesProcessedToday || 0}
              </p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Active Sources</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">
                {stats?.activeSources || 0}/{stats?.totalSources || 0}
              </p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Last Fetch</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-sm font-medium text-slate-900 mt-1">
                {stats?.lastFetch 
                  ? formatDistanceToNow(new Date(stats.lastFetch), { addSuffix: true })
                  : 'Never'
                }
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleFetchRss}
            disabled={runningAction !== null}
          >
            {runningAction === 'fetch' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rss className="w-4 h-4 mr-2" />
            )}
            Fetch RSS Now
          </Button>
          <Button
            variant="outline"
            onClick={handleProcessArticles}
            disabled={runningAction !== null}
          >
            {runningAction === 'process' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4 mr-2" />
            )}
            Process Pending
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
              queryClient.invalidateQueries({ queryKey: ['rss-sources'] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Stats
          </Button>
        </div>

        {/* RSS Sources Status */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">RSS Sources Status</h3>
          {sourcesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sources && sources.length > 0 ? (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {source.is_active ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{source.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {source.feed_url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    {source.last_fetched_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Never fetched
                      </Badge>
                    )}
                    <Badge variant={source.is_active ? 'default' : 'secondary'}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No RSS sources configured</p>
            </div>
          )}
        </div>

        {/* Scheduling Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2">Scheduling</h4>
          <p className="text-sm text-blue-700">
            To automate the pipeline, set up a cron job or external scheduler to call:
          </p>
          <code className="block mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900 overflow-x-auto">
            POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-news-pipeline
          </code>
          <p className="text-xs text-blue-600 mt-2">
            Recommended: Every 30 minutes during 5 AM - 10 PM EST
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

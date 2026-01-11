import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Play, 
  RefreshCw, 
  Check, 
  X as XIcon,
  Loader2,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

const AdminAI = () => {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const [processedToday, pending, totalTokens] = await Promise.all([
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .not('ai_summary', 'is', null)
          .gte('updated_at', startOfToday)
          .lte('updated_at', endOfToday),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .is('ai_summary', null)
          .eq('status', 'pending'),
        supabase
          .from('ai_processing_logs')
          .select('tokens_used')
          .gte('created_at', startOfToday),
      ]);

      const totalTokensUsed = totalTokens.data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;

      return {
        processedToday: processedToday.count || 0,
        pendingCount: pending.count || 0,
        tokensUsedToday: totalTokensUsed,
      };
    },
  });

  // Fetch pending articles for dropdown
  const { data: pendingArticles } = useQuery({
    queryKey: ['admin-pending-articles-ai'],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title')
        .is('ai_summary', null)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Fetch recent logs
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-ai-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_processing_logs')
        .select(`
          id,
          article_id,
          category_result,
          tokens_used,
          success,
          error_message,
          created_at,
          articles(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Process pending articles mutation
  const processPendingMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-article-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: 'process_pending' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process articles');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-articles-ai'] });
      
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failCount = data.results?.filter((r: any) => !r.success).length || 0;
      
      if (failCount > 0) {
        toast.warning(`Processed ${successCount} articles, ${failCount} failed`);
      } else if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} articles`);
      } else {
        toast.info('No pending articles to process');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process articles');
    },
    onSettled: () => {
      setIsProcessing(false);
      setProcessingProgress(100);
    },
  });

  // Process single article mutation
  const processSingleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-article-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ articleId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process article');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-articles-ai'] });
      setSelectedArticle('');
      toast.success('Article processed successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process article');
    },
  });

  const statCards = [
    {
      label: 'Processed Today',
      value: stats?.processedToday || 0,
      icon: Check,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Pending Processing',
      value: stats?.pendingCount || 0,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Tokens Used Today',
      value: stats?.tokensUsedToday?.toLocaleString() || 0,
      icon: Zap,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            AI Processing
          </h1>
          <p className="text-slate-600">Process articles with AI for summaries and categorization</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Process Pending */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              Process Pending Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Process up to 10 pending articles at once. Each article will be analyzed 
              for category, neighborhood, and will receive an AI-generated summary.
            </p>
            
            {isProcessing && (
              <div className="mb-4">
                <Progress value={processingProgress} className="h-2" />
                <p className="text-sm text-slate-500 mt-1">Processing articles...</p>
              </div>
            )}
            
            <Button
              onClick={() => processPendingMutation.mutate()}
              disabled={processPendingMutation.isPending || (stats?.pendingCount || 0) === 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {processPendingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Process Pending Articles ({stats?.pendingCount || 0})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reprocess Single */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Reprocess Article
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Select a specific article to reprocess. This will regenerate the AI 
              summary and update categorization.
            </p>
            
            <div className="flex gap-3">
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an article..." />
                </SelectTrigger>
                <SelectContent>
                  {pendingArticles?.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => selectedArticle && processSingleMutation.mutate(selectedArticle)}
                disabled={!selectedArticle || processSingleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processSingleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Recent Processing Logs
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : recentLogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No processing logs yet
                </TableCell>
              </TableRow>
            ) : (
              recentLogs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <p className="font-medium text-slate-900 truncate max-w-xs">
                      {log.articles?.title || 'Unknown Article'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.category_result || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {log.tokens_used?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XIcon className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {log.created_at && format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
};

export default AdminAI;

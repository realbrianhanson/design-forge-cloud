import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Rss,
  Newspaper,
  Shield,
  Cloud,
  Building2,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Database,
  Activity,
  Zap,
} from 'lucide-react';
import {
  useRssSourcesStats,
  usePipelineStats,
  useCrimeDataStats,
  useWeatherDataStats,
  useBusinessDataStats,
  useEventDataStats,
  useActionLogs,
  useDataOperations,
} from '@/hooks/useAdminDataStats';

const AdminData = () => {
  const rssStats = useRssSourcesStats();
  const pipelineStats = usePipelineStats();
  const crimeStats = useCrimeDataStats();
  const weatherStats = useWeatherDataStats();
  const businessStats = useBusinessDataStats();
  const eventStats = useEventDataStats();
  const actionLogs = useActionLogs();
  const operations = useDataOperations();

  const isAnyLoading = operations.fetchRss.isPending || 
    operations.processArticles.isPending || 
    operations.fetchCrime.isPending ||
    operations.fetchWeather.isPending ||
    operations.fetchCityEvents.isPending ||
    operations.fetchEventbrite.isPending ||
    operations.runFullPipeline.isPending;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-teal-600" />
            Data Management
          </h1>
          <p className="text-slate-600 mt-1">
            Monitor and manage all data sources and pipelines
          </p>
        </div>
        <Button 
          onClick={() => operations.runFullPipeline.mutate()}
          disabled={isAnyLoading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {operations.runFullPipeline.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Run Full Pipeline
        </Button>
      </div>

      {/* Top Row - RSS & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* RSS Feeds Status */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Rss className="w-5 h-5 text-orange-500" />
                RSS Feeds Status
              </CardTitle>
              <CardDescription>News source aggregation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/data/rss">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => operations.fetchRss.mutate()}
                disabled={operations.fetchRss.isPending}
              >
                {operations.fetchRss.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1.5">Fetch All</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rssStats.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">{rssStats.data?.totalSources || 0}</p>
                    <p className="text-xs text-slate-500">Total Sources</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{rssStats.data?.totalActive || 0}</p>
                    <p className="text-xs text-slate-500">Active</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{rssStats.data?.totalPaused || 0}</p>
                    <p className="text-xs text-slate-500">Paused</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{rssStats.data?.articlesToday || 0}</p>
                    <p className="text-xs text-slate-500">Today</p>
                  </div>
                </div>

                {/* Last Fetch */}
                <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last fetch: {rssStats.data?.lastFetch 
                    ? formatDistanceToNow(new Date(rssStats.data.lastFetch), { addSuffix: true })
                    : 'Never'}
                </div>

                {/* Sources Table */}
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Today</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rssStats.data?.sources.slice(0, 6).map((source) => (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell>
                            <Badge variant={source.is_active ? "default" : "secondary"} className="text-xs">
                              {source.is_active ? '✓ Active' : 'Paused'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{source.articles_today}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content Pipeline */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Content Pipeline
              </CardTitle>
              <CardDescription>AI processing status</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => operations.processArticles.mutate()}
                disabled={operations.processArticles.isPending}
              >
                {operations.processArticles.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="ml-1.5">Process</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pipelineStats.isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <>
                {/* Pipeline Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{pipelineStats.data?.pendingArticles || 0}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{pipelineStats.data?.totalProcessed || 0}</p>
                    <p className="text-xs text-slate-500">Processed Today</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{pipelineStats.data?.errorsToday || 0}</p>
                    <p className="text-xs text-slate-500">Errors</p>
                  </div>
                </div>

                {/* Pipeline Visualization */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Rss className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">RSS Fetch</p>
                        <p className="text-xs text-slate-500">Sources</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pipelineStats.data?.pendingArticles || 0} pending</p>
                        <p className="text-xs text-slate-500">Queue</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI Processing</p>
                        <p className="text-xs text-slate-500">Active</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Published</p>
                        <p className="text-xs text-slate-500">Live</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link to="/admin/ai">
                    <Button variant="outline" size="sm">View Errors</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Crime, Weather, Business, Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Crime Data */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Crime Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crimeStats.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Today</span>
                    <span className="font-semibold">{crimeStats.data?.incidentsToday || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Last 30 days</span>
                    <span className="font-semibold">{crimeStats.data?.last30Days?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Last sync</span>
                    <span className="text-sm">
                      {crimeStats.data?.lastSync 
                        ? formatDistanceToNow(new Date(crimeStats.data.lastSync), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  variant="outline"
                  onClick={() => operations.fetchCrime.mutate()}
                  disabled={operations.fetchCrime.isPending}
                >
                  {operations.fetchCrime.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Fetch Crime Data
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Weather Data */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              Weather Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherStats.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Current</span>
                    <span className="font-semibold">
                      {weatherStats.data?.currentTemp ? `${weatherStats.data.currentTemp}°F` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Conditions</span>
                    <span className="text-sm">{weatherStats.data?.currentConditions || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Active alerts</span>
                    <Badge variant={weatherStats.data?.activeAlerts ? "destructive" : "secondary"}>
                      {weatherStats.data?.activeAlerts || 0}
                    </Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  variant="outline"
                  onClick={() => operations.fetchWeather.mutate()}
                  disabled={operations.fetchWeather.isPending}
                >
                  {operations.fetchWeather.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Refresh Weather
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Business Data */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-500" />
              Business Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {businessStats.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total</span>
                    <span className="font-semibold">{businessStats.data?.totalBusinesses?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">This week</span>
                    <span className="font-semibold">+{businessStats.data?.addedThisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Pending review</span>
                    <Badge variant={businessStats.data?.pendingReview ? "secondary" : "outline"}>
                      {businessStats.data?.pendingReview || 0}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    variant="outline"
                    onClick={() => operations.importBusinesses.mutate()}
                    disabled={operations.importBusinesses.isPending}
                  >
                    {operations.importBusinesses.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Import'
                    )}
                  </Button>
                  <Link to="/admin/businesses" className="flex-1">
                    <Button size="sm" className="w-full" variant="outline">Review</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Events Data */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Events Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventStats.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total upcoming</span>
                    <span className="font-semibold">{eventStats.data?.totalEvents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">This week</span>
                    <span className="font-semibold">{eventStats.data?.thisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Pending</span>
                    <Badge variant={eventStats.data?.pendingApproval ? "secondary" : "outline"}>
                      {eventStats.data?.pendingApproval || 0}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    variant="outline"
                    onClick={() => operations.fetchCityEvents.mutate()}
                    disabled={operations.fetchCityEvents.isPending}
                  >
                    {operations.fetchCityEvents.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'City'
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    variant="outline"
                    onClick={() => operations.fetchEventbrite.mutate()}
                    disabled={operations.fetchEventbrite.isPending}
                  >
                    {operations.fetchEventbrite.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Eventbrite'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Log */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Recent Actions
            </CardTitle>
            <CardDescription>Latest data operations and system events</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/data/api-keys">
              <Button size="sm" variant="outline">API Keys</Button>
            </Link>
            <Link to="/admin/data/logs">
              <Button size="sm" variant="outline">View All Logs</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {actionLogs.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : actionLogs.data && actionLogs.data.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {actionLogs.data.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    log.status === 'success' ? 'bg-green-100' :
                    log.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : log.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500 truncate">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.timestamp), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No recent actions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminData;

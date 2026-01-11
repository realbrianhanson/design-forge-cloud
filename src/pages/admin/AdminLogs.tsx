import { useState } from 'react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ScrollText,
  ArrowLeft,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Rss,
  Shield,
  Cloud,
  Building2,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DataOperationLog {
  id: string;
  operation_type: string;
  operation_name: string;
  status: string;
  details: string | null;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

const OPERATION_TYPES = [
  { value: 'all', label: 'All Operations' },
  { value: 'rss', label: 'RSS Fetch', icon: Rss },
  { value: 'ai', label: 'AI Processing', icon: Zap },
  { value: 'crime', label: 'Crime Data', icon: Shield },
  { value: 'weather', label: 'Weather', icon: Cloud },
  { value: 'business', label: 'Business', icon: Building2 },
  { value: 'event', label: 'Events', icon: Calendar },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'pending', label: 'Pending' },
];

const DATE_RANGES = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const getOperationIcon = (type: string) => {
  const config = OPERATION_TYPES.find(t => t.value === type);
  const Icon = config?.icon || ScrollText;
  return <Icon className="w-4 h-4" />;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    case 'warning':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Warning
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDuration = (ms: number | null) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const AdminLogs = () => {
  const [operationType, setOperationType] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [selectedLog, setSelectedLog] = useState<DataOperationLog | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch logs with filters
  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-operation-logs', operationType, status, dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      
      let query = supabase
        .from('data_operation_logs')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(200);

      if (operationType !== 'all') {
        query = query.eq('operation_type', operationType);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01') return [];
        throw error;
      }
      
      return (data || []) as DataOperationLog[];
    },
    refetchInterval: 30000,
  });

  // Calculate stats
  const stats = {
    total: logs?.length || 0,
    success: logs?.filter(l => l.status === 'success').length || 0,
    errors: logs?.filter(l => l.status === 'error').length || 0,
    warnings: logs?.filter(l => l.status === 'warning').length || 0,
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/admin/data"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Data Management
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ScrollText className="w-8 h-8 text-blue-500" />
              Operation Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              View and filter data operation history
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Operations</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Errors</p>
            <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="grid gap-1.5">
              <Label className="text-xs">Operation Type</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOperationType('all');
                setStatus('all');
                setDateRange('7');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            Showing {logs?.length || 0} operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <>
                      <TableRow 
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRowExpanded(log.id)}
                      >
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {expandedRows.has(log.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(new Date(log.created_at), 'h:mm:ss a')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {getOperationIcon(log.operation_type)}
                            </div>
                            <div>
                              <p className="font-medium">{log.operation_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {log.operation_type}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {log.details || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatDuration(log.duration_ms)}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow key={`${log.id}-expanded`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-3">
                              {log.details && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Details</p>
                                  <p className="text-sm text-muted-foreground">{log.details}</p>
                                </div>
                              )}
                              
                              {log.error_message && (
                                <div>
                                  <p className="text-sm font-medium mb-1 text-red-600">Error Message</p>
                                  <pre className="text-sm bg-red-50 text-red-800 p-3 rounded-lg overflow-x-auto">
                                    {log.error_message}
                                  </pre>
                                </div>
                              )}

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Metadata</p>
                                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}

                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>ID: {log.id}</span>
                                <span>Created: {format(new Date(log.created_at), 'PPpp')}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No logs found matching your filters</p>
              <p className="text-sm text-muted-foreground mt-1">
                Logs will appear here as data operations are performed
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLogs;

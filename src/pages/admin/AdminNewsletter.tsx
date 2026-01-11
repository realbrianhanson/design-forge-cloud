import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Mail, 
  Users, 
  UserPlus, 
  UserMinus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X as XIcon,
  Clock
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const ITEMS_PER_PAGE = 20;

const AdminNewsletter = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-newsletter-stats'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now).toISOString();
      const weekEnd = endOfWeek(now).toISOString();

      const [total, subscribedThisWeek, unsubscribedThisWeek] = await Promise.all([
        supabase
          .from('newsletter_subscribers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'verified'),
        supabase
          .from('newsletter_subscribers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'verified')
          .gte('verified_at', weekStart)
          .lte('verified_at', weekEnd),
        supabase
          .from('newsletter_subscribers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'unsubscribed')
          .gte('unsubscribed_at', weekStart)
          .lte('unsubscribed_at', weekEnd),
      ]);

      return {
        totalSubscribers: total.count || 0,
        subscribedThisWeek: subscribedThisWeek.count || 0,
        unsubscribedThisWeek: unsubscribedThisWeek.count || 0,
      };
    },
  });

  // Fetch subscribers
  const { data, isLoading } = useQuery({
    queryKey: ['admin-newsletter-subscribers', search, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { subscribers: data || [], count: count || 0 };
    },
  });

  const exportCSV = async () => {
    const { data: allSubscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, status, daily_digest, weekly_newsletter, breaking_news, created_at, verified_at')
      .eq('status', 'verified')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to export subscribers');
      return;
    }

    if (!allSubscribers || allSubscribers.length === 0) {
      toast.info('No subscribers to export');
      return;
    }

    // Create CSV
    const headers = ['Email', 'Status', 'Daily Digest', 'Weekly Newsletter', 'Breaking News', 'Created At', 'Verified At'];
    const rows = allSubscribers.map(s => [
      s.email,
      s.status,
      s.daily_digest ? 'Yes' : 'No',
      s.weekly_newsletter ? 'Yes' : 'No',
      s.breaking_news ? 'Yes' : 'No',
      s.created_at,
      s.verified_at || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `904news-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${allSubscribers.length} subscribers`);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'unsubscribed':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Unsubscribed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPreferences = (subscriber: any) => {
    const prefs = [];
    if (subscriber.daily_digest) prefs.push('Daily');
    if (subscriber.weekly_newsletter) prefs.push('Weekly');
    if (subscriber.breaking_news) prefs.push('Breaking');
    return prefs.length > 0 ? prefs.join(', ') : '—';
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const statCards = [
    {
      label: 'Total Subscribers',
      value: stats?.totalSubscribers || 0,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Subscribed This Week',
      value: stats?.subscribedThisWeek || 0,
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Unsubscribed This Week',
      value: stats?.unsubscribedThisWeek || 0,
      icon: UserMinus,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'unsubscribed', label: 'Unsubscribed' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-teal-600" />
            Newsletter
          </h1>
          <p className="text-slate-600">Manage newsletter subscribers and campaigns</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preferences</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              data?.subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                  <TableCell className="text-slate-600">{getPreferences(subscriber)}</TableCell>
                  <TableCell className="text-slate-600">
                    {subscriber.created_at && format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-slate-600">
              Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, data?.count || 0)} of {data?.count || 0}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Future: Manual Send Section */}
      <Card className="mt-8 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-700">Campaign Sending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Coming Soon</p>
            <p className="text-sm">Manual campaign sending and previews will be available here</p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminNewsletter;

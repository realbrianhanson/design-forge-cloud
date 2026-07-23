import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityRow {
  id: string;
  operation_type: string;
  operation_name: string;
  status: string;
  details: string | null;
  created_at: string;
}

const statusColor = (s: string) => {
  if (s === 'success' || s === 'completed') return 'text-green-700 border-green-300';
  if (s === 'failed' || s === 'error') return 'text-red-700 border-red-300';
  if (s === 'pending' || s === 'running') return 'text-yellow-700 border-yellow-300';
  return 'text-slate-700 border-slate-300';
};

const AdminActivities = () => {
  const { data, isLoading } = useQuery<ActivityRow[]>({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_operation_logs')
        .select('id, operation_type, operation_name, status, details, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as ActivityRow[]) || [];
    },
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-600 mt-1">Recent operations and system activity.</p>
      </div>

      <Card className="bg-white">
        <CardHeader><CardTitle className="text-lg">All Activities</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data && data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-slate-900">System</TableCell>
                      <TableCell className="text-slate-600">{a.operation_type}</TableCell>
                      <TableCell className="text-slate-700 max-w-xs truncate">
                        {a.operation_name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor(a.status)}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/activities/${a.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No activity records yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminActivities;

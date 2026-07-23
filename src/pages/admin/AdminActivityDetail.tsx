import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminActivityDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-activity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_operation_logs')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link to="/admin/activities">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to activities
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error || !data ? (
        <Card className="bg-white">
          <CardContent className="text-center py-16 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Activity not found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Activity Details</h1>
            <p className="text-slate-600 mt-1">Read-only record.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Operation">{data.operation_name}</Field>
                <Field label="Type">
                  <Badge variant="outline">{data.operation_type}</Badge>
                </Field>
                <Field label="Status">
                  <Badge variant="outline">{data.status}</Badge>
                </Field>
                <Field label="Details">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {data.details || '—'}
                  </p>
                </Field>
                {data.error_message && (
                  <Field label="Error">
                    <p className="text-red-700 whitespace-pre-wrap">{data.error_message}</p>
                  </Field>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader><CardTitle className="text-lg">Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="User">System</Field>
                <Field label="Timestamp">
                  {format(new Date(data.created_at), 'PPpp')}
                </Field>
                {typeof data.duration_ms === 'number' && (
                  <Field label="Duration">{data.duration_ms} ms</Field>
                )}
                <Field label="ID">
                  <code className="text-xs text-slate-600 break-all">{data.id}</code>
                </Field>
              </CardContent>
            </Card>

            {data.metadata && Object.keys(data.metadata).length > 0 && (
              <Card className="bg-white lg:col-span-3">
                <CardHeader><CardTitle className="text-lg">Log Data</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto text-slate-700">
                    {JSON.stringify(data.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
    <div className="text-slate-900">{children}</div>
  </div>
);

export default AdminActivityDetail;

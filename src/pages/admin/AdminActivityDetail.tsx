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

type ActivityType = 'user' | 'event';

interface ActivityDetailData {
  id: string;
  type: ActivityType;
  title: string;
  status: string;
  created_at: string;
  raw: Record<string, unknown>;
}

const AdminActivityDetail = () => {
  const params = useParams<{ type?: string; id: string }>();
  const id = params.id;
  // Support legacy /admin/activities/:id by trying both tables when type isn't in the URL.
  const type = (params.type as ActivityType | undefined) ?? undefined;

  const { data, isLoading, error } = useQuery<ActivityDetailData | null>({
    queryKey: ['admin-activity-detail', type, id],
    queryFn: async () => {
      if (!id) return null;

      const tryUser = async (): Promise<ActivityDetailData | null> => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!data) return null;
        return {
          id: data.id,
          type: 'user',
          title: `New user signup: ${data.display_name || 'Anonymous'}`,
          status: 'success',
          created_at: data.created_at || '',
          raw: data as Record<string, unknown>,
        };
      };

      const tryEvent = async (): Promise<ActivityDetailData | null> => {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!data) return null;
        return {
          id: data.id,
          type: 'event',
          title: data.title,
          status: data.status || 'unknown',
          created_at: data.created_at || '',
          raw: data as Record<string, unknown>,
        };
      };

      if (type === 'user') return (await tryUser()) ?? (await tryEvent());
      if (type === 'event') return (await tryEvent()) ?? (await tryUser());
      return (await tryUser()) ?? (await tryEvent());
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
                <Field label="Title">{data.title}</Field>
                <Field label="Type">
                  <Badge variant="outline" className="capitalize">{data.type}</Badge>
                </Field>
                <Field label="Status">
                  <Badge variant="outline" className="capitalize">{data.status}</Badge>
                </Field>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader><CardTitle className="text-lg">Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Timestamp">
                  {data.created_at ? format(new Date(data.created_at), 'PPpp') : '—'}
                </Field>
                <Field label="ID">
                  <code className="text-xs text-slate-600 break-all">{data.id}</code>
                </Field>
              </CardContent>
            </Card>

            <Card className="bg-white lg:col-span-3">
              <CardHeader><CardTitle className="text-lg">Record Data</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto text-slate-700">
                  {JSON.stringify(data.raw, null, 2)}
                </pre>
              </CardContent>
            </Card>
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

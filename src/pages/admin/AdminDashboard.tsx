import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { NewsPipelineAdmin } from '@/components/admin/NewsPipelineAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Newspaper, 
  Calendar, 
  Building2, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UserPlus,
  FileText,
  Store
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { isAdmin } = useAdminAuth();


  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [
        articles, pendingEvents, businesses, users,
        articlesCur, articlesPrev,
        businessesCur, businessesPrev,
        usersCur, usersPrev,
        eventsCur, eventsPrev,
      ] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
        supabase.from('articles').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
        supabase.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', d30),
        supabase.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', d30),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
      ]);

      return {
        totalArticles: articles.count || 0,
        pendingEvents: pendingEvents.count || 0,
        activeBusinesses: businesses.count || 0,
        totalUsers: users.count || 0,
        articlesCur: articlesCur.count || 0,
        articlesPrev: articlesPrev.count || 0,
        businessesCur: businessesCur.count || 0,
        businessesPrev: businessesPrev.count || 0,
        usersCur: usersCur.count || 0,
        usersPrev: usersPrev.count || 0,
        eventsCur: eventsCur.count || 0,
        eventsPrev: eventsPrev.count || 0,
      };
    },
    enabled: !!isAdmin,
  });

  const computeDelta = (cur: number, prev: number): { change: string; positive: boolean } => {
    if (prev === 0) {
      if (cur === 0) return { change: 'No change', positive: true };
      return { change: 'New', positive: true };
    }
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (pct === 0) return { change: 'No change', positive: true };
    return { change: `${pct > 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  };

  const articlesDelta = computeDelta(stats?.articlesCur || 0, stats?.articlesPrev || 0);
  const businessesDelta = computeDelta(stats?.businessesCur || 0, stats?.businessesPrev || 0);
  const usersDelta = computeDelta(stats?.usersCur || 0, stats?.usersPrev || 0);

  // Fetch pending events
  const { data: pendingEventsList } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // Fetch recent signups
  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      // Get recent events and user signups for activity feed
      const [events, users] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_profiles')
          .select('id, display_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const activities: Array<{
        id: string;
        type: 'user' | 'event' | 'business';
        title: string;
        timestamp: string;
        link?: string;
      }> = [];

      users.data?.forEach((user) => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          title: `New user signed up: ${user.display_name || 'Anonymous'}`,
          timestamp: user.created_at || '',
          link: `/admin/activities/user/${user.id}`,
        });
      });

      events.data?.forEach((event) => {
        activities.push({
          id: `event-${event.id}`,
          type: 'event',
          title: `Event ${event.status === 'pending' ? 'submitted' : 'published'}: ${event.title}`,
          timestamp: event.created_at || '',
          link: `/admin/activities/event/${event.id}`,
        });
      });

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
    },
    enabled: !!isAdmin,
  });

  const statCards = [
    {
      label: 'Total Articles',
      value: stats?.totalArticles || 0,
      icon: Newspaper,
      color: 'bg-blue-100 text-blue-600',
      change: articlesDelta.change,
      positive: articlesDelta.positive,
    },
    {
      label: 'Pending Events',
      value: stats?.pendingEvents || 0,
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-600',
      change: stats?.pendingEvents ? 'Needs review' : 'All clear',
      positive: !stats?.pendingEvents,
    },
    {
      label: 'Active Businesses',
      value: stats?.activeBusinesses || 0,
      icon: Building2,
      color: 'bg-green-100 text-green-600',
      change: businessesDelta.change,
      positive: businessesDelta.positive,
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      change: usersDelta.change,
      positive: usersDelta.positive,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-yellow-600" />;
      case 'business':
        return <Store className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {profile?.display_name || 'Admin'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.positive ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {stat.positive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>{stat.change}</span>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pending Events */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending Events</CardTitle>
            <Link to="/admin/events">
              <Button variant="outline" size="sm">Review Events</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingEventsList && pendingEventsList.length > 0 ? (
              <ul className="space-y-3">
                {pendingEventsList.map((event) => (
                  <li key={event.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{event.title}</p>
                      <p className="text-sm text-slate-500">
                        Submitted {formatDistanceToNow(new Date(event.created_at || ''), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No pending events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Signups</CardTitle>
            <Link to="/admin/users">
              <Button variant="outline" size="sm">View All Users</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers && recentUsers.length > 0 ? (
              <ul className="space-y-3">
                {recentUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {user.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {user.display_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Joined {formatDistanceToNow(new Date(user.created_at || ''), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No recent signups</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* News Pipeline */}
      <div className="mb-8">
        <NewsPipelineAdmin />
      </div>

      {/* Activity Chart Placeholder */}
      <Card className="bg-white mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Site Activity - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <div className="text-center text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Analytics Coming Soon</p>
              <p className="text-sm">Page views and engagement metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <ul className="space-y-4">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {activity.link && (
                    <Link 
                      to={activity.link}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdminUserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: 'admin' | 'user';
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    role: 'user' as 'admin' | 'user', status: 'active' as 'active' | 'disabled',
  });

  const { data: users, isLoading } = useQuery<AdminUserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('user_profiles').select('id, display_name, avatar_url, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const roleMap = new Map<string, 'admin' | 'user'>();
      (roles || []).forEach((r: any) => {
        if (r.role === 'admin') roleMap.set(r.user_id, 'admin');
        else if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, 'user');
      });
      return (profiles || []).map((p: any) => ({
        ...p, role: roleMap.get(p.id) || 'user',
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.email || !form.password) throw new Error('Email and password are required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) throw new Error('Invalid email format');
      if (form.password.length < 8) throw new Error('Password must be at least 8 characters');
      if (form.password !== form.confirm) throw new Error('Passwords do not match');

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            password: form.password,
            full_name: form.full_name.trim() || null,
            role: form.role,
            status: form.status,
          }),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create user');
      return body;
    },
    onSuccess: () => {
      toast({ title: 'User created', description: 'The account was created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setOpen(false);
      setForm({ full_name: '', email: '', password: '', confirm: '', role: 'user', status: 'active' });
    },
    onError: (e) => toast({
      title: 'Could not create user',
      description: e instanceof Error ? e.message : 'Unknown error',
      variant: 'destructive',
    }),
  });

  return (
    <AdminLayout>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">View accounts and add admin users.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="w-4 h-4 mr-2" /> Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>Create a new account and assign a role.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input id="email" type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pw">Password *</Label>
                  <Input id="pw" type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpw">Confirm *</Label>
                  <Input id="cpw" type="password" required value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v: 'admin' | 'user') => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account status</Label>
                  <Select value={form.status} onValueChange={(v: 'active' | 'disabled') => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}
                disabled={createMutation.isPending}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700">
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                ) : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white">
        <CardHeader><CardTitle className="text-lg">All Users</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                              {u.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-900">
                            {u.display_name || 'Anonymous'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className={u.role === 'admin' ? 'bg-teal-600' : ''}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-700 border-green-300">Active</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No users yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;

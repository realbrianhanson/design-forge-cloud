import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Search, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Check, 
  X as XIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';

const ITEMS_PER_PAGE = 20;

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Tables<'events'> | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch events count by status for header
  const { data: pendingCount } = useQuery({
    queryKey: ['admin-events-pending-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
  });

  // Fetch events with admin view
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', search, statusFilter, categoryFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { events: data || [], count: count || 0 };
    },
  });

  // Fetch unique categories for filters
  const { data: categories } = useQuery({
    queryKey: ['admin-event-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('category').order('category');
      return [...new Set(data?.map(e => e.category) || [])];
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events-pending-count'] });
      toast.success('Event updated');
    },
    onError: () => {
      toast.error('Failed to update event');
    },
  });

  const handleApprove = (eventId: string) => {
    updateMutation.mutate({ id: eventId, updates: { status: 'approved' } });
    setSelectedEvent(null);
  };

  const handleReject = () => {
    if (selectedEvent) {
      updateMutation.mutate({ 
        id: selectedEvent.id, 
        updates: { status: 'rejected' } 
      });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedEvent(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data?.events.map(e => e.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600">Manage community events and submissions</p>
        </div>
        {pendingCount && pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search events..."
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
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === data?.events.length && data?.events.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Event Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              data?.events.map((event) => (
                <TableRow 
                  key={event.id}
                  className={event.status === 'pending' ? 'bg-yellow-50/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(event.id)}
                      onCheckedChange={(checked) => handleSelect(event.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="text-left hover:text-teal-600"
                    >
                      <p className="font-medium text-slate-900 truncate max-w-xs">
                        {event.title}
                      </p>
                      <p className="text-sm text-slate-500 truncate max-w-xs">
                        {event.location_name}
                      </p>
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {event.organizer_name || '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell className="text-slate-600">
                    {event.created_at
                      ? format(new Date(event.created_at), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {event.slug && (
                          <DropdownMenuItem asChild>
                            <Link to={`/events/${event.slug}`} target="_blank">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {event.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleApprove(event.id)}
                              className="text-green-600"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEvent(event);
                                setRejectDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <XIcon className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Event Details Sheet */}
      <Sheet open={!!selectedEvent && !rejectDialogOpen} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.title}</SheetTitle>
                <SheetDescription>
                  Review event details and take action
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Event Image */}
                {selectedEvent.image_url && (
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Status:</span>
                  {getStatusBadge(selectedEvent.status)}
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {format(new Date(selectedEvent.start_time), 'h:mm a')}
                      {selectedEvent.end_time && (
                        <> - {format(new Date(selectedEvent.end_time), 'h:mm a')}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {selectedEvent.location_name && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedEvent.location_name}</p>
                      {selectedEvent.location_address && (
                        <p className="text-sm text-slate-600">{selectedEvent.location_address}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {selectedEvent.organizer_name && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedEvent.organizer_name}</p>
                      <p className="text-sm text-slate-600">Organizer</p>
                    </div>
                  </div>
                )}

                {/* Submitted */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Submitted {selectedEvent.created_at && format(new Date(selectedEvent.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-slate-600">
                      Source: {selectedEvent.source_type || 'User'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Price */}
                <div>
                  <h4 className="font-medium mb-2">Pricing</h4>
                  <p className="text-sm text-slate-600">
                    {selectedEvent.price_type === 'free' ? 'Free' : 
                      selectedEvent.price_min && selectedEvent.price_max
                        ? `$${selectedEvent.price_min} - $${selectedEvent.price_max}`
                        : selectedEvent.price_min
                          ? `From $${selectedEvent.price_min}`
                          : 'Paid'}
                  </p>
                </div>

                {/* Actions */}
                {selectedEvent.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(selectedEvent.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectDialogOpen(true)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this event. This will be sent to the organizer.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEvents;

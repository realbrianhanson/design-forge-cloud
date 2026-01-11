import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Star,
  Check,
  X as XIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';

const ITEMS_PER_PAGE = 20;

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'claims', label: 'Claims Pending' },
];

const AdminBusinesses = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [claimedFilter, setClaimedFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectedBusiness, setSelectedBusiness] = useState<Tables<'businesses'> | null>(null);

  // Fetch claims count for badge
  const { data: claimsCount } = useQuery({
    queryKey: ['admin-claims-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('claimed', true)
        .eq('verified', false);
      return count || 0;
    },
  });

  // Fetch businesses
  const { data, isLoading } = useQuery({
    queryKey: ['admin-businesses', search, statusFilter, categoryFilter, claimedFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (statusFilter === 'claims') {
        query = query.eq('claimed', true).eq('verified', false);
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (claimedFilter === 'claimed') {
        query = query.eq('claimed', true);
      } else if (claimedFilter === 'unclaimed') {
        query = query.eq('claimed', false);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { businesses: data || [], count: count || 0 };
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['admin-business-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('business_categories').select('name').order('name');
      return data?.map(c => c.name) || [];
    },
  });

  // Fetch neighborhoods for display
  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data } = await supabase.from('neighborhoods').select('id, name');
      return data || [];
    },
  });

  const getNeighborhoodName = (id: string | null) => {
    if (!id) return '—';
    return neighborhoods?.find(n => n.id === id)?.name || '—';
  };

  // Update business mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('businesses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims-count'] });
      toast.success('Business updated');
    },
    onError: () => {
      toast.error('Failed to update business');
    },
  });

  const handleVerify = (businessId: string) => {
    updateMutation.mutate({ id: businessId, updates: { verified: true } });
    setSelectedBusiness(null);
  };

  const handleRejectClaim = (businessId: string) => {
    updateMutation.mutate({ 
      id: businessId, 
      updates: { claimed: false, claimed_by: null, verified: false } 
    });
    setSelectedBusiness(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data?.businesses.map(b => b.id) || []);
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
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Inactive</Badge>;
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
          <h1 className="text-3xl font-bold text-slate-900">Businesses</h1>
          <p className="text-slate-600">Manage business directory listings</p>
        </div>
        {claimsCount && claimsCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
            {claimsCount} pending claims
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
                placeholder="Search businesses..."
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

            {/* Claimed Filter */}
            <Select value={claimedFilter} onValueChange={setClaimedFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Claimed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="unclaimed">Unclaimed</SelectItem>
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
                  checked={selectedIds.length === data?.businesses.length && data?.businesses.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Neighborhood</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Claimed</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No businesses found
                </TableCell>
              </TableRow>
            ) : (
              data?.businesses.map((business) => (
                <TableRow 
                  key={business.id}
                  className={business.claimed && !business.verified ? 'bg-yellow-50/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(business.id)}
                      onCheckedChange={(checked) => handleSelect(business.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedBusiness(business)}
                      className="text-left hover:text-teal-600"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={business.logo_url || undefined} />
                          <AvatarFallback className="bg-slate-100">
                            <Building2 className="w-5 h-5 text-slate-400" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-[200px]">
                            {business.name}
                          </p>
                          {business.is_featured && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">{business.category}</TableCell>
                  <TableCell className="text-slate-600">
                    {getNeighborhoodName(business.neighborhood_id)}
                  </TableCell>
                  <TableCell>{getStatusBadge(business.status)}</TableCell>
                  <TableCell>
                    {business.claimed ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <XIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {business.verified ? (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedBusiness(business)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/businesses/${business.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Public Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!business.verified && (
                          <DropdownMenuItem
                            onClick={() => handleVerify(business.id)}
                            className="text-blue-600"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Verify
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => updateMutation.mutate({
                            id: business.id,
                            updates: { is_featured: !business.is_featured }
                          })}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {business.is_featured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateMutation.mutate({
                            id: business.id,
                            updates: { status: business.status === 'active' ? 'inactive' : 'active' }
                          })}
                          className={business.status === 'active' ? 'text-red-600' : 'text-green-600'}
                        >
                          {business.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
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

      {/* Business Details Sheet */}
      <Sheet open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          {selectedBusiness && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedBusiness.name}</SheetTitle>
                <SheetDescription>
                  Business details and management
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Cover Image */}
                {selectedBusiness.cover_image_url && (
                  <img
                    src={selectedBusiness.cover_image_url}
                    alt={selectedBusiness.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                {/* Status & Verification */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedBusiness.status)}
                  {selectedBusiness.claimed && (
                    <Badge className="bg-green-100 text-green-800">Claimed</Badge>
                  )}
                  {selectedBusiness.verified && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {selectedBusiness.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Category */}
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedBusiness.category}</p>
                    {selectedBusiness.subcategories && selectedBusiness.subcategories.length > 0 && (
                      <p className="text-sm text-slate-600">
                        {selectedBusiness.subcategories.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {selectedBusiness.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedBusiness.address}</p>
                      <p className="text-sm text-slate-600">
                        {selectedBusiness.city}, {selectedBusiness.state} {selectedBusiness.zip_code}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact */}
                {selectedBusiness.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <p>{selectedBusiness.phone}</p>
                  </div>
                )}
                {selectedBusiness.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <p>{selectedBusiness.email}</p>
                  </div>
                )}
                {selectedBusiness.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <a 
                      href={selectedBusiness.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline"
                    >
                      {selectedBusiness.website}
                    </a>
                  </div>
                )}

                {/* Description */}
                {selectedBusiness.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {selectedBusiness.description}
                    </p>
                  </div>
                )}

                {/* Claim Info */}
                {selectedBusiness.claimed && !selectedBusiness.verified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Pending Claim Review</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          A user has claimed this business. Please review and verify.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions for pending claims */}
                {selectedBusiness.claimed && !selectedBusiness.verified && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleVerify(selectedBusiness.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Approve & Verify
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectClaim(selectedBusiness.id)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Reject Claim
                    </Button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedBusiness.view_count || 0}
                    </p>
                    <p className="text-sm text-slate-500">Views</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedBusiness.rating?.toFixed(1) || '—'}
                    </p>
                    <p className="text-sm text-slate-500">Rating</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminBusinesses;

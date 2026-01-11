import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Rss,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface RssSource {
  id: string;
  name: string;
  slug: string;
  feed_url: string;
  website_url: string | null;
  category_default: string | null;
  fetch_frequency_minutes: number | null;
  is_active: boolean;
  last_fetched_at: string | null;
  articles_count: number | null;
  logo_url: string | null;
}

interface RssSourceFormData {
  name: string;
  slug: string;
  feed_url: string;
  website_url: string;
  category_default: string;
  fetch_frequency_minutes: number;
  is_active: boolean;
}

const CATEGORIES = [
  'local',
  'politics',
  'crime',
  'business',
  'sports',
  'entertainment',
  'weather',
  'health',
  'education',
  'traffic',
];

const FREQUENCIES = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
];

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const AdminRssSources = () => {
  const queryClient = useQueryClient();
  const [editingSource, setEditingSource] = useState<RssSource | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RssSource | null>(null);
  const [deleteArticles, setDeleteArticles] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const [formData, setFormData] = useState<RssSourceFormData>({
    name: '',
    slug: '',
    feed_url: '',
    website_url: '',
    category_default: 'local',
    fetch_frequency_minutes: 30,
    is_active: true,
  });

  // Fetch all RSS sources
  const { data: sources, isLoading } = useQuery({
    queryKey: ['admin-rss-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as RssSource[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RssSourceFormData) => {
      const { error } = await supabase.from('rss_sources').insert([{
        name: data.name,
        slug: data.slug,
        feed_url: data.feed_url,
        website_url: data.website_url || null,
        category_default: data.category_default,
        fetch_frequency_minutes: data.fetch_frequency_minutes,
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('RSS source created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-rss-sources'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create source: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RssSourceFormData }) => {
      const { error } = await supabase
        .from('rss_sources')
        .update({
          name: data.name,
          slug: data.slug,
          feed_url: data.feed_url,
          website_url: data.website_url || null,
          category_default: data.category_default,
          fetch_frequency_minutes: data.fetch_frequency_minutes,
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('RSS source updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-rss-sources'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update source: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, deleteArticles }: { id: string; deleteArticles: boolean }) => {
      if (deleteArticles) {
        // Delete articles from this source first
        const { error: articlesError } = await supabase
          .from('articles')
          .delete()
          .eq('rss_source_id', id);
        if (articlesError) throw articlesError;
      }
      
      const { error } = await supabase
        .from('rss_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('RSS source deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-rss-sources'] });
      setDeleteConfirm(null);
      setDeleteArticles(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete source: ${error.message}`);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('rss_sources')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rss-sources'] });
    },
  });

  // Fetch single source mutation
  const fetchSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await supabase.functions.invoke('fetch-rss', {
        body: { sourceId: id },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Fetched ${data?.articlesImported || 0} articles`);
      queryClient.invalidateQueries({ queryKey: ['admin-rss-sources'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to fetch: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      feed_url: '',
      website_url: '',
      category_default: 'local',
      fetch_frequency_minutes: 30,
      is_active: true,
    });
    setEditingSource(null);
    setIsAddingNew(false);
    setTestResult(null);
  };

  const openEditDialog = (source: RssSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      slug: source.slug,
      feed_url: source.feed_url,
      website_url: source.website_url || '',
      category_default: source.category_default || 'local',
      fetch_frequency_minutes: source.fetch_frequency_minutes || 30,
      is_active: source.is_active,
    });
    setTestResult(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isAddingNew ? generateSlug(name) : prev.slug,
    }));
  };

  const handleTestFeed = async () => {
    if (!formData.feed_url) {
      setTestResult({ success: false, message: 'Please enter a feed URL' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(formData.feed_url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      
      // Basic XML/RSS check
      if (text.includes('<rss') || text.includes('<feed') || text.includes('<channel')) {
        setTestResult({
          success: true,
          message: 'Valid RSS/Atom feed detected',
        });
      } else {
        setTestResult({
          success: false,
          message: 'URL does not appear to be a valid RSS/Atom feed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to fetch feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug || !formData.feed_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingSource) {
      updateMutation.mutate({ id: editingSource.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isDialogOpen = isAddingNew || editingSource !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

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
              <Rss className="w-8 h-8 text-orange-500" />
              RSS Sources
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage news feed sources for article aggregation
            </p>
          </div>
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sources</CardTitle>
          <CardDescription>
            {sources?.length || 0} sources configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Fetch</TableHead>
                    <TableHead className="text-right">Articles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources?.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {source.logo_url ? (
                            <img 
                              src={source.logo_url} 
                              alt={source.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Rss className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {source.feed_url}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={source.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: source.id, is_active: checked })
                            }
                          />
                          <Badge 
                            variant={source.is_active ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {source.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {source.category_default || 'local'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {FREQUENCIES.find(f => f.value === source.fetch_frequency_minutes)?.label || 
                          `${source.fetch_frequency_minutes} min`}
                      </TableCell>
                      <TableCell>
                        {source.last_fetched_at ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{source.articles_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => fetchSourceMutation.mutate(source.id)}
                            disabled={fetchSourceMutation.isPending}
                            title="Fetch Now"
                          >
                            {fetchSourceMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          {source.website_url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                              title="Visit Website"
                            >
                              <a href={source.website_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(source)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(source)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? 'Edit RSS Source' : 'Add RSS Source'}
            </DialogTitle>
            <DialogDescription>
              {editingSource 
                ? 'Update the RSS feed configuration' 
                : 'Add a new news source to aggregate articles from'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="News4Jax"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="news4jax"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feed_url">Feed URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="feed_url"
                  value={formData.feed_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, feed_url: e.target.value }))}
                  placeholder="https://example.com/rss"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestFeed}
                  disabled={isTesting}
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                </Button>
              </div>
              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Default Category</Label>
                <Select
                  value={formData.category_default}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_default: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="frequency">Fetch Frequency</Label>
                <Select
                  value={formData.fetch_frequency_minutes.toString()}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    fetch_frequency_minutes: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value.toString()}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (fetch articles automatically)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSource ? 'Save Changes' : 'Add Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RSS Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center gap-2 py-4">
            <Checkbox
              id="delete-articles"
              checked={deleteArticles}
              onCheckedChange={(checked) => setDeleteArticles(checked === true)}
            />
            <label htmlFor="delete-articles" className="text-sm text-muted-foreground">
              Also delete all articles from this source ({deleteConfirm?.articles_count || 0} articles)
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteArticles(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate({ 
                id: deleteConfirm.id, 
                deleteArticles 
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRssSources;

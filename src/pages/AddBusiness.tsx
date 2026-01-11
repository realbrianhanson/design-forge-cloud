import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Phone, Globe, DollarSign, User, Share2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCategories } from '@/hooks/useBusinesses';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { businessFormSchema, BusinessFormData, generateSlug } from '@/lib/businessValidation';
import { AddressAutocomplete } from '@/components/directory/AddressAutocomplete';
import { BusinessPreview } from '@/components/directory/BusinessPreview';
import { DuplicateWarning } from '@/components/directory/DuplicateWarning';
import { suggestCategory, checkDuplicates } from '@/hooks/useAddressAutocomplete';

const US_STATES = [
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'SC', label: 'South Carolina' },
];

const AddBusiness = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useBusinessCategories();
  const { data: neighborhoods = [] } = useNeighborhoods();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSlug, setSubmittedSlug] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string; address: string | null; slug: string }>>([]);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  
  // Coordinates from address selection
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      address: '',
      city: 'Jacksonville',
      state: 'FL',
      zipCode: '',
      neighborhoodId: '',
      phone: '',
      website: '',
      email: '',
      priceLevel: undefined,
      isOwner: false,
    },
  });

  const watchedValues = form.watch();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin?redirect=/businesses/add');
    }
  }, [user, authLoading, navigate]);

  // Category suggestion based on business name
  useEffect(() => {
    const name = watchedValues.name;
    if (name && name.length > 3 && !watchedValues.category) {
      const suggested = suggestCategory(name);
      if (suggested) {
        form.setValue('category', suggested);
      }
    }
  }, [watchedValues.name]);

  // Check for duplicates when name changes
  const handleNameBlur = useCallback(async () => {
    const name = watchedValues.name;
    const address = watchedValues.address;
    
    if (!name || name.length < 3 || duplicateConfirmed) return;
    
    setCheckingDuplicates(true);
    const result = await checkDuplicates(name, address);
    setDuplicates(result.duplicates);
    setCheckingDuplicates(false);
  }, [watchedValues.name, watchedValues.address, duplicateConfirmed]);

  // Handle address selection from autocomplete
  const handleAddressSelect = (suggestion: {
    address_line1: string;
    city?: string;
    state?: string;
    postcode?: string;
    lat: number;
    lon: number;
  }) => {
    if (suggestion.city) {
      form.setValue('city', suggestion.city);
    }
    if (suggestion.state) {
      form.setValue('state', suggestion.state);
    }
    if (suggestion.postcode) {
      form.setValue('zipCode', suggestion.postcode);
    }
    
    // Store coordinates
    setCoordinates({ lat: suggestion.lat, lon: suggestion.lon });
    
    // Try to match neighborhood by ZIP
    if (suggestion.postcode && neighborhoods.length > 0) {
      const matchingNeighborhood = neighborhoods.find(n => 
        n.zip_codes?.includes(suggestion.postcode!)
      );
      if (matchingNeighborhood) {
        form.setValue('neighborhoodId', matchingNeighborhood.id);
      }
    }
  };

  const onSubmit = async (data: BusinessFormData) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to add a business',
        variant: 'destructive',
      });
      return;
    }

    // Check duplicates one more time if not confirmed
    if (!duplicateConfirmed && duplicates.length === 0) {
      const result = await checkDuplicates(data.name, data.address);
      if (result.hasDuplicates) {
        setDuplicates(result.duplicates);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Generate a unique slug
      const baseSlug = generateSlug(data.name);
      const timestamp = Date.now().toString(36);
      const slug = `${baseSlug}-${timestamp}`;

      const businessData = {
        name: data.name,
        slug,
        category: data.category,
        description: data.description || null,
        short_description: data.description?.substring(0, 150) || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        neighborhood_id: data.neighborhoodId || null,
        phone: data.phone || null,
        website: data.website || null,
        email: data.email || null,
        price_level: data.priceLevel || null,
        claimed: data.isOwner,
        claimed_by: data.isOwner ? user.id : null,
        status: 'pending',
        source: 'user',
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lon || null,
      };

      const { error } = await supabase.from('businesses').insert(businessData);

      if (error) throw error;

      setSubmittedName(data.name);
      setSubmittedSlug(slug);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting business:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  // Enhanced Success State
  if (submitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-sm p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Thanks for adding {submittedName}!
            </h1>
            <p className="text-muted-foreground mb-6">
              We'll review your submission and publish it within 48 hours.
            </p>
            
            {/* Share buttons */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Share the good news:</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out ${submittedName} on 904News!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  𝕏 Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out ${submittedName} on 904News!`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  Facebook
                </Button>
              </div>
            </div>

            {watchedValues.isOwner && (
              <div className="bg-accent/10 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-foreground flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-accent" />
                  Business Owner Benefits
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Update your business information anytime</li>
                  <li>• Respond to customer reviews</li>
                  <li>• Add photos and special offers</li>
                  <li>• Access business analytics</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/businesses')} className="w-full">
                Browse Directory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setDuplicates([]);
                  setDuplicateConfirmed(false);
                  setCoordinates(null);
                  form.reset();
                }}
              >
                Add Another Business
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-surface py-8 md:py-12">
        <div className="container-news">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Add a Business</h1>
            <p className="text-muted-foreground">
              Help grow the Jacksonville business directory
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl shadow-sm p-6 md:p-8">
                {/* Duplicate Warning */}
                {duplicates.length > 0 && !duplicateConfirmed && (
                  <div className="mb-6">
                    <DuplicateWarning
                      duplicates={duplicates}
                      onConfirmNew={() => {
                        setDuplicateConfirmed(true);
                        setDuplicates([]);
                      }}
                      onDismiss={() => setDuplicates([])}
                    />
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <Building2 className="w-5 h-5" />
                        <h2 className="font-semibold">Basic Information</h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Bold Bean Coffee" 
                                {...field}
                                onBlur={() => {
                                  field.onBlur();
                                  handleNameBlur();
                                }}
                              />
                            </FormControl>
                            {checkingDuplicates && (
                              <p className="text-xs text-muted-foreground">Checking for duplicates...</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Category *</FormLabel>
                              {field.value && watchedValues.name && suggestCategory(watchedValues.name) === field.value && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-suggested
                                </Badge>
                              )}
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={categoriesLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.slug}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                                {categories.length === 0 && (
                                  <>
                                    <SelectItem value="restaurants">Restaurants</SelectItem>
                                    <SelectItem value="shopping">Shopping</SelectItem>
                                    <SelectItem value="health">Health & Medical</SelectItem>
                                    <SelectItem value="beauty">Beauty & Spa</SelectItem>
                                    <SelectItem value="fitness">Fitness</SelectItem>
                                    <SelectItem value="automotive">Automotive</SelectItem>
                                    <SelectItem value="professional">Professional Services</SelectItem>
                                    <SelectItem value="entertainment">Entertainment</SelectItem>
                                    <SelectItem value="home-services">Home Services</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Briefly describe this business..."
                                rows={4}
                                maxLength={500}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location with Autocomplete */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <MapPin className="w-5 h-5" />
                        <h2 className="font-semibold">Location</h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address *</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                value={field.value}
                                onChange={field.onChange}
                                onSelect={handleAddressSelect}
                                placeholder="Start typing an address..."
                              />
                            </FormControl>
                            <FormDescription>
                              Type to search for addresses in Jacksonville area
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {US_STATES.map((state) => (
                                    <SelectItem key={state.value} value={state.value}>
                                      {state.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="32204" maxLength={10} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="neighborhoodId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Neighborhood</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {neighborhoods.map((n) => (
                                    <SelectItem key={n.id} value={n.id}>
                                      {n.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {coordinates && (
                        <p className="text-xs text-muted-foreground">
                          📍 Location coordinates saved for map display
                        </p>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <Phone className="w-5 h-5" />
                        <h2 className="font-semibold">Contact Information</h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(904) 555-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" type="url" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <DollarSign className="w-5 h-5" />
                        <h2 className="font-semibold">Additional Details</h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="priceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Level</FormLabel>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4].map((level) => (
                                <Button
                                  key={level}
                                  type="button"
                                  variant={field.value === level ? 'default' : 'outline'}
                                  className={field.value === level ? 'bg-accent hover:bg-accent/90' : ''}
                                  onClick={() => field.onChange(field.value === level ? undefined : level)}
                                >
                                  {'$'.repeat(level)}
                                </Button>
                              ))}
                            </div>
                            <FormDescription>
                              Select the approximate price range
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ownership */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <User className="w-5 h-5" />
                        <h2 className="font-semibold">Ownership</h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="isOwner"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer">
                                I am the owner or authorized representative of this business
                              </FormLabel>
                              <FormDescription>
                                Check this to claim the business listing and manage it
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit */}
                    <div className="border-t border-border pt-6">
                      <Button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90"
                        size="lg"
                        disabled={isSubmitting || (duplicates.length > 0 && !duplicateConfirmed)}
                      >
                        {isSubmitting ? 'Adding Business...' : 'Add Business'}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Submissions are reviewed before publishing
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Sidebar - Live Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Mobile Preview Toggle */}
                <Button
                  variant="outline"
                  className="w-full mb-4 lg:hidden"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>

                <div className={`${showPreview ? 'block' : 'hidden'} lg:block`}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Live Preview
                  </h3>
                  <BusinessPreview
                    name={watchedValues.name}
                    category={watchedValues.category}
                    description={watchedValues.description}
                    address={watchedValues.address}
                    city={watchedValues.city}
                    state={watchedValues.state}
                    zipCode={watchedValues.zipCode}
                    phone={watchedValues.phone}
                    website={watchedValues.website}
                    priceLevel={watchedValues.priceLevel}
                  />

                  {/* Tips */}
                  <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-medium text-foreground text-sm mb-2">💡 Tips</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Use your official business name</li>
                      <li>• Add a detailed description to attract customers</li>
                      <li>• Include your website and phone for easy contact</li>
                      <li>• Claim your listing to manage it later</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddBusiness;

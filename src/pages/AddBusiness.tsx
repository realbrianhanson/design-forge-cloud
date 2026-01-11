import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Phone, Globe, DollarSign, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [submittedName, setSubmittedName] = useState('');

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin?redirect=/businesses/add');
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: BusinessFormData) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to add a business',
        variant: 'destructive',
      });
      return;
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
      };

      const { error } = await supabase.from('businesses').insert(businessData);

      if (error) throw error;

      setSubmittedName(data.name);
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

  // Success State
  if (submitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-sm p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Thanks for adding {submittedName}!
            </h1>
            <p className="text-muted-foreground mb-8">
              We'll review your submission and publish it within 48 hours.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/businesses')} className="w-full">
                Browse Directory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
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
        <div className="container-news max-w-xl">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Add a Business</h1>
            <p className="text-muted-foreground">
              Help grow the Jacksonville business directory
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6 md:p-8">
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
                          <Input placeholder="e.g., Bold Bean Coffee" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                            {/* Fallback categories if none loaded */}
                            {categories.length === 0 && (
                              <>
                                <SelectItem value="restaurants">Restaurants</SelectItem>
                                <SelectItem value="shopping">Shopping</SelectItem>
                                <SelectItem value="services">Services</SelectItem>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
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

                {/* Location */}
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
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    disabled={isSubmitting}
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
      </div>
    </Layout>
  );
};

export default AddBusiness;

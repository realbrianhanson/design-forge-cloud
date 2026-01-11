import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, ArrowLeft, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { ImageUpload } from '@/components/events/ImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { supabase } from '@/integrations/supabase/client';
import { eventSubmissionSchema, EventSubmissionFormData } from '@/lib/eventValidation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'family', label: 'Family' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'arts', label: 'Arts' },
  { value: 'community', label: 'Community' },
  { value: 'business', label: 'Business' },
  { value: 'nightlife', label: 'Nightlife' },
];

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return {
    value: `${hours.toString().padStart(2, '0')}:${displayMinutes}`,
    label: `${displayHours}:${displayMinutes} ${ampm}`,
  };
});

const US_STATES = [
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'SC', label: 'South Carolina' },
];

const EventSubmit = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: neighborhoods } = useNeighborhoods();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<EventSubmissionFormData>({
    resolver: zodResolver(eventSubmissionSchema),
    defaultValues: {
      title: '',
      category: undefined,
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      isAllDay: false,
      isVirtual: false,
      venueName: '',
      streetAddress: '',
      city: 'Jacksonville',
      state: 'FL',
      zipCode: '',
      neighborhoodId: '',
      virtualEventUrl: '',
      priceType: 'free',
      priceMin: undefined,
      priceMax: undefined,
      ticketUrl: '',
      organizerName: '',
      contactEmail: '',
      website: '',
    },
  });

  const isVirtual = form.watch('isVirtual');
  const isAllDay = form.watch('isAllDay');
  const priceType = form.watch('priceType');
  const title = form.watch('title');
  const description = form.watch('description');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth/signin?redirect=${encodeURIComponent('/events/submit')}`);
    }
  }, [user, authLoading, navigate]);

  // Set default organizer name from user
  useEffect(() => {
    if (user?.user_metadata?.full_name && !form.getValues('organizerName')) {
      form.setValue('organizerName', user.user_metadata.full_name);
    }
  }, [user, form]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('event-images')
      .upload(fileName, file);

    if (error) {
      console.error('Image upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36);
  };

  const onSubmit = async (data: EventSubmissionFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast.error('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Combine date and time
      const startDateTime = data.isAllDay 
        ? `${data.startDate}T00:00:00`
        : `${data.startDate}T${data.startTime || '00:00'}:00`;
      
      let endDateTime = null;
      if (data.endDate) {
        endDateTime = data.isAllDay
          ? `${data.endDate}T23:59:59`
          : `${data.endDate}T${data.endTime || '23:59'}:00`;
      } else if (data.endTime && !data.isAllDay) {
        endDateTime = `${data.startDate}T${data.endTime}:00`;
      }

      // Build location address
      const locationAddress = data.isVirtual 
        ? null 
        : [data.streetAddress, data.city, data.state, data.zipCode].filter(Boolean).join(', ');

      // Insert event
      const { error } = await supabase.from('events').insert({
        title: data.title,
        slug: generateSlug(data.title),
        description: data.description,
        short_description: data.description.substring(0, 200),
        category: data.category,
        start_time: startDateTime,
        end_time: endDateTime,
        location_name: data.isVirtual ? 'Virtual Event' : data.venueName,
        location_address: locationAddress,
        neighborhood_id: data.neighborhoodId || null,
        price_type: data.priceType,
        price_min: data.priceType === 'paid' ? data.priceMin : null,
        price_max: data.priceType === 'paid' ? data.priceMax : null,
        ticket_url: data.ticketUrl || data.virtualEventUrl || null,
        image_url: imageUrl,
        organizer_name: data.organizerName,
        organizer_id: user.id,
        status: 'pending',
        source_type: 'user',
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Event submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="section-spacing">
          <div className="max-w-xl mx-auto px-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isSuccess) {
    return (
      <Layout>
        <div className="section-spacing">
          <div className="max-w-xl mx-auto px-4 text-center">
            <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-3">
              🎉 Event Submitted!
            </h1>
            <p className="text-muted-foreground mb-8">
              We'll review your event and email you within 24 hours. Thank you for sharing with the Jacksonville community!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => { setIsSuccess(false); form.reset(); setImageFile(null); }}>
                Submit Another Event
              </Button>
              <Link to="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-spacing">
        <div className="max-w-xl mx-auto px-4">
          {/* Back Link */}
          <Link 
            to="/events" 
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Submit an Event</h1>
            <p className="text-muted-foreground mt-1">
              Share your event with the Jacksonville community
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Basic Information
                </h2>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What's your event called?" 
                          maxLength={100}
                          {...field} 
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {title.length}/100
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell people what to expect at your event..."
                          rows={6}
                          maxLength={2000}
                          {...field} 
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {description.length}/2000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </section>

              {/* Date & Time */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Date & Time
                </h2>

                <FormField
                  control={form.control}
                  name="isAllDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        This is an all-day event
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isAllDay && (
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map(time => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isAllDay && (
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map(time => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </section>

              {/* Location */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Location
                </h2>

                <FormField
                  control={form.control}
                  name="isVirtual"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        This is a virtual/online event
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {isVirtual ? (
                  <FormField
                    control={form.control}
                    name="virtualEventUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event URL *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://zoom.us/..." 
                            type="url"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="venueName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., TIAA Bank Field, Bold Bean Coffee" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="streetAddress"
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

                    <div className="grid grid-cols-3 gap-4">
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
                                {US_STATES.map(state => (
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

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="32099" maxLength={10} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="neighborhoodId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neighborhood</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select neighborhood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {neighborhoods?.map(n => (
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
                  </>
                )}
              </section>

              {/* Tickets & Pricing */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Tickets & Pricing
                </h2>

                <FormField
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Type *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="free" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Free
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="paid" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Paid
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="donation" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Donation / Pay what you can
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {priceType === 'paid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priceMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                className="pl-7"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                className="pl-7"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="ticketUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket/Registration URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          type="url"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Where can people get tickets or register?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Event Image */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Event Image
                </h2>

                <ImageUpload 
                  value={imageFile} 
                  onChange={setImageFile} 
                />
              </section>

              {/* Organizer Information */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  Organizer Information
                </h2>

                <FormField
                  control={form.control}
                  name="organizerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name or organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="email@example.com" 
                          type="email"
                          {...field} 
                        />
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
                        <Input 
                          placeholder="https://..." 
                          type="url"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Submit */}
              <div className="pt-6 border-t border-border">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Submit Event for Review
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Events are typically reviewed within 24 hours. You'll receive an email when approved.
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default EventSubmit;

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Loader2, Check } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address');

interface NewsletterSignupFormProps {
  variant?: 'inline' | 'card' | 'full';
  source?: string;
}

export const NewsletterSignupForm = ({ 
  variant = 'card', 
  source = 'unknown' 
}: NewsletterSignupFormProps) => {
  const [email, setEmail] = useState('');
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(true);
  const [breakingNews, setBreakingNews] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (subscriberEmail: string) => {
      // Validate email
      const validatedEmail = emailSchema.parse(subscriberEmail);

      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, status, verified_at')
        .eq('email', validatedEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'verified' || existing.verified_at) {
          throw new Error('already_subscribed');
        }
        // Resubscribe if unsubscribed
        if (existing.status === 'unsubscribed') {
          const verificationToken = crypto.randomUUID();
          const { error } = await supabase
            .from('newsletter_subscribers')
            .update({
              status: 'pending',
              verification_token: verificationToken,
              unsubscribed_at: null,
              daily_digest: dailyDigest,
              weekly_newsletter: weeklyNewsletter,
              breaking_news: breakingNews,
            })
            .eq('id', existing.id);
          if (error) throw error;
          
          // Send verification email
          await sendVerificationEmail(validatedEmail, verificationToken);
          return { resubscribed: true };
        }
        // Already pending - resend verification
        const verificationToken = crypto.randomUUID();
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ verification_token: verificationToken })
          .eq('id', existing.id);
        if (error) throw error;
        await sendVerificationEmail(validatedEmail, verificationToken);
        return { resent: true };
      }

      // New subscriber
      const verificationToken = crypto.randomUUID();
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: validatedEmail,
          status: 'pending',
          verification_token: verificationToken,
          daily_digest: dailyDigest,
          weekly_newsletter: weeklyNewsletter,
          breaking_news: breakingNews,
        });
      if (error) throw error;

      // Send verification email
      await sendVerificationEmail(validatedEmail, verificationToken);
      return { subscribed: true };
    },
    onSuccess: () => {
      setIsSuccess(true);
      setEmail('');
    },
    onError: (error) => {
      if (error.message === 'already_subscribed') {
        toast.info("You're already subscribed!");
      } else if (error instanceof z.ZodError) {
        toast.error('Please enter a valid email address');
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    },
  });

  const sendVerificationEmail = async (email: string, token: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          type: 'verification',
          email, 
          token,
          baseUrl: window.location.origin
        }),
      }
    );
    if (!response.ok) {
      console.error('Failed to send verification email');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    subscribeMutation.mutate(email);
  };

  if (isSuccess) {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-sm">Check your email to confirm!</span>
        </div>
      );
    }
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900">Check your inbox!</h3>
          <p className="text-green-700 mt-2">
            We sent a confirmation link to <strong>{email}</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Inline variant - designed for dark backgrounds like primary
  if (variant === 'inline') {
    return (
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-foreground mb-2">
          Stay Connected to Jacksonville
        </h2>
        <p className="text-primary-foreground/80 mb-6 text-sm sm:text-base">
          Get the latest news, events, and local updates delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white text-foreground min-h-[48px]"
            required
          />
          <Button 
            type="submit" 
            disabled={subscribeMutation.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground min-h-[48px] px-6"
          >
            {subscribeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </Button>
        </form>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className="bg-slate-50 border-0">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Daily Jacksonville Digest</h3>
            <p className="text-sm text-slate-600 mt-1">Top stories delivered every morning</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white"
              required
            />
            <Button 
              type="submit" 
              disabled={subscribeMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {subscribeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-3">
            Unsubscribe anytime. No spam, ever.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className="bg-white border shadow-lg max-w-lg mx-auto">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Stay Informed</h2>
          <p className="text-slate-600 mt-2">
            Get the latest Jacksonville news delivered to your inbox
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Email Preferences</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="daily" 
                  checked={dailyDigest}
                  onCheckedChange={(checked) => setDailyDigest(checked as boolean)}
                />
                <div>
                  <Label htmlFor="daily" className="font-medium">Daily Digest</Label>
                  <p className="text-xs text-slate-500">Morning news summary</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="weekly" 
                  checked={weeklyNewsletter}
                  onCheckedChange={(checked) => setWeeklyNewsletter(checked as boolean)}
                />
                <div>
                  <Label htmlFor="weekly" className="font-medium">Weekly Newsletter</Label>
                  <p className="text-xs text-slate-500">Weekend recap and highlights</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="breaking" 
                  checked={breakingNews}
                  onCheckedChange={(checked) => setBreakingNews(checked as boolean)}
                />
                <div>
                  <Label htmlFor="breaking" className="font-medium">Breaking News Alerts</Label>
                  <p className="text-xs text-slate-500">Major stories as they happen</p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={subscribeMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {subscribeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Subscribing...
              </>
            ) : (
              'Subscribe Now'
            )}
          </Button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          By subscribing, you agree to receive emails from 904News.
          Unsubscribe anytime with one click.
        </p>
      </CardContent>
    </Card>
  );
};

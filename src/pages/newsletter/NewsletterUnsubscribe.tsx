import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, AlertCircle, Mail } from 'lucide-react';

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'confirm' | 'loading' | 'success' | 'error' | 'not_found'>('confirm');

  useEffect(() => {
    // Validate that we have an email
    if (!email) {
      setStatus('error');
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;
    
    setStatus('loading');
    
    try {
      // Find subscriber
      const { data: subscriber, error: findError } = await supabase
        .from('newsletter_subscribers')
        .select('id, status')
        .eq('email', decodeURIComponent(email))
        .maybeSingle();

      if (findError) throw findError;

      if (!subscriber) {
        setStatus('not_found');
        return;
      }

      if (subscriber.status === 'unsubscribed') {
        setStatus('success');
        return;
      }

      // Unsubscribe
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', subscriber.id);

      if (updateError) throw updateError;

      setStatus('success');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
    }
  };

  const handleResubscribe = async () => {
    if (!email) return;
    
    setStatus('loading');
    
    try {
      const verificationToken = crypto.randomUUID();
      
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'pending',
          verification_token: verificationToken,
          unsubscribed_at: null,
        })
        .eq('email', decodeURIComponent(email));

      if (updateError) throw updateError;

      // Send verification email
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            type: 'verification',
            email: decodeURIComponent(email), 
            token: verificationToken,
            baseUrl: window.location.origin
          }),
        }
      );

      setStatus('confirm');
    } catch (error) {
      console.error('Resubscribe error:', error);
      setStatus('error');
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-8 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </>
            )}

            {status === 'confirm' && (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Sorry to See You Go</h1>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to unsubscribe from 904News emails?
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleUnsubscribe}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Yes, Unsubscribe Me
                  </Button>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link to="/">No, Keep Me Subscribed</Link>
                  </Button>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">You've Been Unsubscribed</h1>
                <p className="text-slate-600 mb-6">
                  You won't receive any more emails from 904News. We're sorry to see you go!
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleResubscribe}
                    variant="outline"
                  >
                    Made a Mistake? Resubscribe
                  </Button>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link to="/">Go to Homepage</Link>
                  </Button>
                </div>
              </>
            )}

            {status === 'not_found' && (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Not Found</h1>
                <p className="text-slate-600 mb-6">
                  We couldn't find a subscription with that email address.
                </p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link to="/">Go to Homepage</Link>
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Something Went Wrong</h1>
                <p className="text-slate-600 mb-6">
                  We couldn't process your request. Please try again or contact support.
                </p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link to="/">Go to Homepage</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewsletterUnsubscribe;

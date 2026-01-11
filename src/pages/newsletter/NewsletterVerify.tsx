import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X as XIcon, AlertCircle } from 'lucide-react';

const NewsletterVerify = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'already_verified' | 'error'>('loading');

  useEffect(() => {
    const verifySubscription = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Find subscriber by token
        const { data: subscriber, error: findError } = await supabase
          .from('newsletter_subscribers')
          .select('id, status, verified_at')
          .eq('verification_token', token)
          .maybeSingle();

        if (findError) throw findError;

        if (!subscriber) {
          // Token not found - could be already verified or invalid
          setStatus('error');
          return;
        }

        if (subscriber.verified_at || subscriber.status === 'verified') {
          setStatus('already_verified');
          return;
        }

        // Update to verified
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            verification_token: null,
          })
          .eq('id', subscriber.id);

        if (updateError) throw updateError;

        setStatus('success');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    verifySubscription();
  }, [token]);

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

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Subscribed! 🎉</h1>
                <p className="text-slate-600 mb-6">
                  Welcome to 904News! You'll start receiving our newsletters in your inbox.
                </p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link to="/">Go to Homepage</Link>
                </Button>
              </>
            )}

            {status === 'already_verified' && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Already Verified</h1>
                <p className="text-slate-600 mb-6">
                  Your email has already been verified. You're all set to receive our newsletters!
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
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                <p className="text-slate-600 mb-6">
                  We couldn't verify your subscription. The link may have expired or already been used.
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link to="/newsletter">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">Go to Homepage</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewsletterVerify;

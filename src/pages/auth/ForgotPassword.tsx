import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Logo */}
        <Link to="/" className="flex items-baseline justify-center gap-0.5">
          <span className="text-2xl font-bold text-accent">904</span>
          <span className="text-2xl font-bold text-primary">NEWS</span>
        </Link>

        {isSuccess ? (
          /* Success State */
          <div className="text-center mt-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to{' '}
              <span className="font-medium text-primary">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-accent hover:underline"
              >
                try again
              </button>
            </p>
            <Link to="/auth/signin">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="text-center mt-6">
              <h1 className="text-2xl font-bold text-primary">Reset your password</h1>
              <p className="text-muted-foreground mt-1">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2 mt-6">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link
                to="/auth/signin"
                className="text-sm text-accent hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

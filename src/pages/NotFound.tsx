import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { useSearchModal } from '@/hooks/useSearchModal';

const NotFound = () => {
  const { openSearch } = useSearchModal();

  return (
    <>
      <SEO 
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        noindex
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md animate-fade-in">
          {/* Large 404 */}
          <h1 className="text-[12rem] sm:text-[16rem] font-bold text-muted/50 leading-none select-none">
            404
          </h1>
          
          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground -mt-8 mb-4">
            Page not found
          </h2>
          
          {/* Subtext */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={openSearch}
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
          
          {/* Back Link */}
          <button 
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </>
  );
};

export default NotFound;

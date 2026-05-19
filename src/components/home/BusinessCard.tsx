import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessCardProps {
  business: Tables<'businesses'>;
  neighborhoodName?: string;
}

export const BusinessCard = ({ business, neighborhoodName }: BusinessCardProps) => {
  return (
    <Link 
      to={`/directory/${business.slug}`}
      className="group block bg-card rounded-xl shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-200"
    >
      {/* Image/Logo Area */}
      <div className="h-32 bg-surface flex items-center justify-center overflow-hidden">
        {business.cover_image_url ? (
          <img 
            src={business.cover_image_url} 
            alt={business.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : business.logo_url ? (
          <img 
            src={business.logo_url} 
            alt={business.name}
            className="w-16 h-16 object-contain"
          />
        ) : (
          <span className="text-4xl">🏢</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-card-foreground group-hover:text-accent transition-colors line-clamp-1">
          {business.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {business.category}
          {neighborhoodName && ` • ${neighborhoodName}`}
        </p>
        
        {business.rating !== null && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-sm font-medium text-card-foreground">
              {Number(business.rating).toFixed(1)}
            </span>
            {business.review_count !== null && business.review_count > 0 && (
              <span className="text-sm text-muted-foreground">
                ({business.review_count})
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export const BusinessCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <Skeleton className="h-32" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
        <Skeleton className="h-4 w-20 mt-2" />
      </div>
    </div>
  );
};

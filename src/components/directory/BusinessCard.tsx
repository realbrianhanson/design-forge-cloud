import { Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessCardProps {
  business: Tables<'businesses'>;
  neighborhoodName?: string;
}

const categoryIcons: Record<string, string> = {
  'restaurants': '🍽️',
  'food-drink': '🍽️',
  'shopping': '🛍️',
  'services': '🔧',
  'health': '💊',
  'beauty': '💅',
  'fitness': '💪',
  'entertainment': '🎭',
  'nightlife': '🍸',
  'professional': '💼',
  'automotive': '🚗',
  'home': '🏠',
};

export const BusinessCard = ({ business, neighborhoodName }: BusinessCardProps) => {
  const priceSymbol = business.price_level ? '$'.repeat(business.price_level) : null;
  const icon = categoryIcons[business.category.toLowerCase()] || '🏢';

  return (
    <Link
      to={`/businesses/${business.slug}`}
      className="group bg-card rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Image Area */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : business.logo_url ? (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-20 h-20 object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
            <span className="text-5xl">{icon}</span>
          </div>
        )}

        {/* Featured Badge */}
        {business.is_featured && (
          <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-card-foreground text-lg truncate group-hover:text-accent transition-colors">
            {business.name}
          </h3>
          {business.verified && (
            <BadgeCheck className="w-5 h-5 text-accent flex-shrink-0" />
          )}
        </div>

        <p className="text-sm text-muted-foreground capitalize mb-2">
          {business.category.replace(/-/g, ' ')}
        </p>

        {/* Rating Row */}
        {business.rating && (
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="font-medium text-card-foreground">{business.rating.toFixed(1)}</span>
            {business.review_count !== null && business.review_count > 0 && (
              <span className="text-sm text-muted-foreground">
                ({business.review_count})
              </span>
            )}
            {priceSymbol && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{priceSymbol}</span>
              </>
            )}
          </div>
        )}

        {/* Location */}
        {neighborhoodName && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{neighborhoodName}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export const BusinessCardSkeleton = () => (
  <div className="bg-card rounded-xl shadow-sm overflow-hidden">
    <Skeleton className="aspect-[4/3]" />
    <div className="p-5">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-4 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

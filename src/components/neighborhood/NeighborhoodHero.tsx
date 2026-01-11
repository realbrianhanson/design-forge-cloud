import { Newspaper, Calendar, Building2, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';

interface NeighborhoodHeroProps {
  neighborhood: Tables<'neighborhoods'>;
  stats: {
    articleCount: number;
    eventCount: number;
    businessCount: number;
  };
}

export function NeighborhoodHero({ neighborhood, stats }: NeighborhoodHeroProps) {
  return (
    <div className="relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 h-80 md:h-96">
        {neighborhood.image_url ? (
          <img
            src={neighborhood.image_url}
            alt={neighborhood.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container-news pt-32 pb-8 md:pt-48 md:pb-12">
        <div className="max-w-3xl">
          {/* ZIP Codes */}
          {neighborhood.zip_codes && neighborhood.zip_codes.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>ZIP Codes: {neighborhood.zip_codes.join(', ')}</span>
            </div>
          )}

          {/* Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            {neighborhood.name}
          </h1>

          {/* Description */}
          {neighborhood.description && (
            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl">
              {neighborhood.description}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-6">
            <StatItem 
              icon={<Newspaper className="w-5 h-5" />}
              value={stats.articleCount}
              label="articles this week"
            />
            <StatItem 
              icon={<Calendar className="w-5 h-5" />}
              value={stats.eventCount}
              label="upcoming events"
            />
            <StatItem 
              icon={<Building2 className="w-5 h-5" />}
              value={stats.businessCount}
              label="local businesses"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
      <span className="text-accent">{icon}</span>
      <div>
        <span className="font-bold text-foreground text-lg">{value}</span>
        <span className="text-sm text-muted-foreground ml-1.5">{label}</span>
      </div>
    </div>
  );
}

export function NeighborhoodHeroSkeleton() {
  return (
    <div className="relative">
      <div className="absolute inset-0 h-80 md:h-96">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      <div className="relative container-news pt-32 pb-8 md:pt-48 md:pb-12">
        <div className="max-w-3xl">
          <Skeleton className="h-5 w-48 mb-3" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-6 w-full max-w-xl mt-4" />
          <div className="flex gap-4 mt-6">
            <Skeleton className="h-12 w-40 rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Newspaper, Calendar, Building2, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      <div className="absolute inset-0 h-96 md:h-[28rem]">
        {neighborhood.hero_image_url || neighborhood.image_url ? (
          <img
            src={neighborhood.hero_image_url || neighborhood.image_url || ''}
            alt={neighborhood.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container-news pt-32 pb-8 md:pt-56 md:pb-12">
        <div className="max-w-3xl">
          {/* Vibe Badge */}
          {neighborhood.vibe && (
            <Badge className="bg-accent text-accent-foreground mb-4">
              {neighborhood.vibe}
            </Badge>
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

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            {neighborhood.zip_codes && neighborhood.zip_codes.length > 0 && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {neighborhood.zip_codes.join(', ')}
              </span>
            )}
            {neighborhood.population && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                ~{neighborhood.population.toLocaleString()} residents
              </span>
            )}
            {neighborhood.established && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Est. {neighborhood.established}
              </span>
            )}
          </div>

          {/* Highlights */}
          {neighborhood.highlights && neighborhood.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {neighborhood.highlights.map((highlight, i) => (
                <Badge key={i} variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  {highlight}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6">
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
      <div className="absolute inset-0 h-96 md:h-[28rem]">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>
      <div className="relative container-news pt-32 pb-8 md:pt-56 md:pb-12">
        <div className="max-w-3xl">
          <Skeleton className="h-6 w-24 rounded-full mb-4" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-6 w-full max-w-xl mt-4" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <div className="flex gap-4 mt-6">
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-12 w-44 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

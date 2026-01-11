import { Link } from 'react-router-dom';
import { Newspaper, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

interface NeighborhoodCardProps {
  neighborhood: Tables<'neighborhoods'>;
  stats?: {
    articleCount: number;
    eventCount: number;
    businessCount: number;
  };
  className?: string;
}

export function NeighborhoodCard({ neighborhood, stats, className }: NeighborhoodCardProps) {
  return (
    <Link to={`/neighborhoods/${neighborhood.slug}`}>
      <Card className={cn(
        "group overflow-hidden bg-card hover:shadow-card-hover transition-all duration-300",
        className
      )}>
        {/* Image */}
        <div className="aspect-[16/10] overflow-hidden bg-surface relative">
          {neighborhood.thumbnail_url || neighborhood.hero_image_url || neighborhood.image_url ? (
            <img
              src={neighborhood.thumbnail_url || neighborhood.hero_image_url || neighborhood.image_url || ''}
              alt={neighborhood.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-5xl">🏘️</span>
            </div>
          )}
          {/* Vibe Badge */}
          {neighborhood.vibe && (
            <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm">
              {neighborhood.vibe}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors">
            {neighborhood.name}
          </h3>
          
          {neighborhood.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {neighborhood.description}
            </p>
          )}

          {/* Highlights */}
          {neighborhood.highlights && neighborhood.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {neighborhood.highlights.slice(0, 3).map((highlight, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {highlight}
                </Badge>
              ))}
              {neighborhood.highlights.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{neighborhood.highlights.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Newspaper className="w-3.5 h-3.5" />
                {stats.articleCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {stats.eventCount}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {stats.businessCount}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function NeighborhoodCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/10]" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full mt-2" />
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

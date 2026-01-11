import { MapPin, Phone, Globe, DollarSign, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BusinessPreviewProps {
  name?: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  priceLevel?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurants: 'Restaurants',
  shopping: 'Shopping',
  health: 'Health & Medical',
  beauty: 'Beauty & Spa',
  fitness: 'Fitness',
  automotive: 'Automotive',
  professional: 'Professional Services',
  entertainment: 'Entertainment',
  'home-services': 'Home Services',
  other: 'Other',
};

export function BusinessPreview({
  name,
  category,
  description,
  address,
  city,
  state,
  zipCode,
  phone,
  website,
  priceLevel,
}: BusinessPreviewProps) {
  const hasContent = name || category || description || address;
  
  if (!hasContent) {
    return (
      <Card className="bg-secondary/30 border-dashed">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Start filling out the form to see a preview of your business listing
          </p>
        </CardContent>
      </Card>
    );
  }

  const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ');

  return (
    <Card className="overflow-hidden">
      {/* Placeholder cover image */}
      <div className="h-32 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
        <span className="text-5xl">🏢</span>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {name || 'Business Name'}
            </h3>
            {category && (
              <Badge variant="secondary" className="mt-1">
                {CATEGORY_LABELS[category] || category}
              </Badge>
            )}
          </div>
          {priceLevel && (
            <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
              {'$'.repeat(priceLevel)}
            </span>
          )}
        </div>

        {/* Rating placeholder */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="w-4 h-4 fill-warning text-warning" />
          <span className="font-medium text-foreground">New</span>
          <span>•</span>
          <span>No reviews yet</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Address */}
        {fullAddress && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{fullAddress}</span>
          </div>
        )}

        {/* Contact */}
        <div className="flex items-center gap-4 text-sm">
          {phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{phone}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-1 text-accent">
              <Globe className="w-4 h-4" />
              <span className="truncate max-w-[150px]">
                {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
            </div>
          )}
        </div>

        {/* Preview badge */}
        <div className="pt-2 border-t border-border">
          <Badge variant="outline" className="text-xs">
            Preview - Not yet published
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

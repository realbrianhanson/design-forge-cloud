import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  source: {
    name: string;
    logo_url?: string | null;
    website_url?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  showExternalIcon?: boolean;
  className?: string;
}

export const SourceBadge = ({
  source,
  size = 'sm',
  showLink = false,
  showExternalIcon = true,
  className,
}: SourceBadgeProps) => {
  const logoSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        showLink && source.website_url && 'hover:text-accent transition-colors cursor-pointer',
        className
      )}
    >
      {source.logo_url && (
        <img
          src={source.logo_url}
          alt={`${source.name} logo`}
          className={cn(
            logoSizes[size],
            'rounded object-contain flex-shrink-0'
          )}
          onError={(e) => {
            // Hide broken images
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <span className={cn(textSizes[size], 'font-medium')}>
        {source.name}
      </span>
      {showLink && showExternalIcon && source.website_url && (
        <ExternalLink className={cn(iconSizes[size], 'text-muted-foreground')} />
      )}
    </span>
  );

  if (showLink && source.website_url) {
    return (
      <a
        href={source.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        {content}
      </a>
    );
  }

  return content;
};

// Minimal source link for article cards - links to original article
interface SourceLinkProps {
  sourceName: string;
  sourceUrl?: string | null;
  logoUrl?: string | null;
  className?: string;
}

export const SourceLink = ({
  sourceName,
  sourceUrl,
  logoUrl,
  className,
}: SourceLinkProps) => {
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
        sourceUrl && 'hover:text-accent transition-colors',
        className
      )}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="w-4 h-4 rounded object-contain flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <span>{sourceName}</span>
      {sourceUrl && (
        <ExternalLink className="w-3 h-3" />
      )}
    </span>
  );

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex"
      >
        {content}
      </a>
    );
  }

  return content;
};

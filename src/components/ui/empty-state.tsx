import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { 
  Newspaper, 
  Calendar, 
  Building2, 
  Search, 
  Bookmark, 
  MessageSquare,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Button asChild variant="outline" size="sm">
            <Link to={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases

export function EmptyArticles() {
  return (
    <EmptyState
      icon={<Newspaper className="w-8 h-8" />}
      title="No articles yet"
      description="Check back soon for the latest Jacksonville news and stories."
    />
  );
}

export function EmptyEvents() {
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8" />}
      title="No upcoming events"
      description="Be the first to share an event with the community."
      action={{
        label: "Submit an Event",
        href: "/events/submit"
      }}
    />
  );
}

export function EmptyBusinesses() {
  return (
    <EmptyState
      icon={<Building2 className="w-8 h-8" />}
      title="No businesses found"
      description="Know a great local spot? Help the community discover it."
      action={{
        label: "Add a Business",
        href: "/businesses/add"
      }}
    />
  );
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title={`No results for "${query}"`}
      description="Try different keywords or check your spelling."
    />
  );
}

export function EmptySavedItems() {
  return (
    <EmptyState
      icon={<Bookmark className="w-8 h-8" />}
      title="Nothing saved yet"
      description="Explore articles, events, and businesses to save items for later."
      action={{
        label: "Explore News",
        href: "/news"
      }}
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon={<MessageSquare className="w-8 h-8" />}
      title="No comments yet"
      description="Be the first to share your thoughts on this story."
    />
  );
}

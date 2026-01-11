import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-accent",
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        {/* Logo with pulse */}
        <div className="mb-6 animate-pulse">
          <img src={logo} alt="904 News" className="h-12 w-auto mx-auto" />
        </div>
        
        {/* Spinner */}
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        
        {/* Message */}
        {message && (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}

interface SectionLoadingProps {
  className?: string;
}

export function SectionLoading({ className }: SectionLoadingProps) {
  return (
    <div className={cn(
      "flex items-center justify-center py-12",
      className
    )}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

// Skeleton components for content loading states

export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 bg-muted animate-pulse rounded", className)} />
  );
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-muted animate-pulse rounded-lg",
      className
    )} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <SkeletonImage className="aspect-[16/9]" />
      <div className="p-4 space-y-3">
        <SkeletonText className="w-20" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-3/4" />
        <div className="flex gap-2 pt-2">
          <SkeletonText className="w-16" />
          <SkeletonText className="w-12" />
        </div>
      </div>
    </div>
  );
}

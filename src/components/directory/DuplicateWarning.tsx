import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Duplicate {
  id: string;
  name: string;
  address: string | null;
  slug: string;
}

interface DuplicateWarningProps {
  duplicates: Duplicate[];
  onConfirmNew: () => void;
  onDismiss: () => void;
}

export function DuplicateWarning({ duplicates, onConfirmNew, onDismiss }: DuplicateWarningProps) {
  if (duplicates.length === 0) return null;

  return (
    <Alert className="border-warning bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">Similar businesses found</AlertTitle>
      <AlertDescription className="mt-3">
        <p className="text-sm text-muted-foreground mb-3">
          We found {duplicates.length} business{duplicates.length > 1 ? 'es' : ''} that might be the same. 
          Please check if yours is already listed:
        </p>
        
        <ul className="space-y-2 mb-4">
          {duplicates.map((dup) => (
            <li 
              key={dup.id} 
              className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border border-border"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{dup.name}</p>
                {dup.address && (
                  <p className="text-xs text-muted-foreground truncate">{dup.address}</p>
                )}
              </div>
              <Link
                to={`/businesses/${dup.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-accent hover:underline flex-shrink-0"
              >
                View <ExternalLink className="w-3 h-3" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onConfirmNew}
          >
            This is a different business
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
          >
            Cancel
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingFilterProps {
  selectedRating: number | undefined;
  onRatingChange: (rating: number | undefined) => void;
}

const RATING_OPTIONS = [
  { value: undefined, label: 'Any Rating' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
];

export const RatingFilter = ({
  selectedRating,
  onRatingChange,
}: RatingFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      {RATING_OPTIONS.map((option) => {
        const isSelected = selectedRating === option.value;

        return (
          <button
            key={option.label}
            onClick={() => onRatingChange(option.value)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              isSelected
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-card hover:bg-muted border border-border text-foreground'
            )}
          >
            {option.value && <Star className="w-3.5 h-3.5 fill-current" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

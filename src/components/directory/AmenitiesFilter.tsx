import { cn } from '@/lib/utils';
import { AMENITIES } from '@/hooks/useBusinessDirectory';

interface AmenitiesFilterProps {
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
}

export const AmenitiesFilter = ({
  selectedAmenities,
  onAmenityToggle,
}: AmenitiesFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map((amenity) => {
        const isSelected = selectedAmenities.includes(amenity.key);

        return (
          <button
            key={amenity.key}
            onClick={() => onAmenityToggle(amenity.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              isSelected
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-card hover:bg-muted border border-border text-foreground'
            )}
          >
            <span>{amenity.icon}</span>
            <span>{amenity.label}</span>
          </button>
        );
      })}
    </div>
  );
};

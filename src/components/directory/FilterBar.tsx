import { Tables } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  neighborhoods: Tables<'neighborhoods'>[];
  selectedNeighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  selectedPriceLevel: string;
  onPriceLevelChange: (value: string) => void;
  selectedSort: string;
  onSortChange: (value: string) => void;
}

export const FilterBar = ({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
  selectedPriceLevel,
  onPriceLevelChange,
  selectedSort,
  onSortChange,
}: FilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Neighborhood Filter */}
      <Select value={selectedNeighborhood} onValueChange={onNeighborhoodChange}>
        <SelectTrigger className="w-[180px] bg-card">
          <SelectValue placeholder="All Neighborhoods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Neighborhoods</SelectItem>
          {neighborhoods.map((n) => (
            <SelectItem key={n.id} value={n.id}>
              {n.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Price Level Filter */}
      <Select value={selectedPriceLevel} onValueChange={onPriceLevelChange}>
        <SelectTrigger className="w-[120px] bg-card">
          <SelectValue placeholder="Price" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Price</SelectItem>
          <SelectItem value="1">$</SelectItem>
          <SelectItem value="2">$$</SelectItem>
          <SelectItem value="3">$$$</SelectItem>
          <SelectItem value="4">$$$$</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={selectedSort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[160px] bg-card">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recommended">Recommended</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
          <SelectItem value="reviews">Most Reviewed</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

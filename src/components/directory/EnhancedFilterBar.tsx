import { Tables } from '@/integrations/supabase/types';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AmenitiesFilter } from './AmenitiesFilter';
import { RatingFilter } from './RatingFilter';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface EnhancedFilterBarProps {
  neighborhoods: Tables<'neighborhoods'>[];
  selectedNeighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  selectedPriceLevel: string;
  onPriceLevelChange: (value: string) => void;
  selectedSort: string;
  onSortChange: (value: string) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  selectedRating: number | undefined;
  onRatingChange: (rating: number | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export const EnhancedFilterBar = ({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
  selectedPriceLevel,
  onPriceLevelChange,
  selectedSort,
  onSortChange,
  selectedAmenities,
  onAmenityToggle,
  selectedRating,
  onRatingChange,
  onClearFilters,
  activeFilterCount,
}: EnhancedFilterBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
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

        {/* Rating Filter */}
        <RatingFilter
          selectedRating={selectedRating}
          onRatingChange={onRatingChange}
        />

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

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Desktop Amenities */}
      <div className="hidden md:block">
        <AmenitiesFilter
          selectedAmenities={selectedAmenities}
          onAmenityToggle={onAmenityToggle}
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden flex items-center gap-3">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 flex-1">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Narrow down your search
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6 overflow-y-auto">
              {/* Neighborhood */}
              <div>
                <label className="text-sm font-medium mb-2 block">Neighborhood</label>
                <Select value={selectedNeighborhood} onValueChange={onNeighborhoodChange}>
                  <SelectTrigger className="w-full bg-card">
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
              </div>

              <Separator />

              {/* Price Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Price Level</label>
                <Select value={selectedPriceLevel} onValueChange={onPriceLevelChange}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="1">$ - Budget</SelectItem>
                    <SelectItem value="2">$$ - Moderate</SelectItem>
                    <SelectItem value="3">$$$ - Upscale</SelectItem>
                    <SelectItem value="4">$$$$ - Fine Dining</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Rating */}
              <div>
                <label className="text-sm font-medium mb-3 block">Minimum Rating</label>
                <RatingFilter
                  selectedRating={selectedRating}
                  onRatingChange={onRatingChange}
                />
              </div>

              <Separator />

              {/* Amenities */}
              <div>
                <label className="text-sm font-medium mb-3 block">Amenities</label>
                <AmenitiesFilter
                  selectedAmenities={selectedAmenities}
                  onAmenityToggle={onAmenityToggle}
                />
              </div>

              <Separator />

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={selectedSort} onValueChange={onSortChange}>
                  <SelectTrigger className="w-full bg-card">
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClearFilters();
                      setSheetOpen(false);
                    }}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={() => setSheetOpen(false)}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Sort */}
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[130px] bg-card">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="reviews">Most Reviewed</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

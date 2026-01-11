import { useState } from 'react';
import { Filter, Calendar, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CrimeFilters as CrimeFiltersType } from '@/hooks/useCrimeData';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';

interface CrimeFiltersProps {
  filters: CrimeFiltersType;
  onFiltersChange: (filters: CrimeFiltersType) => void;
  incidentTypes?: string[];
  className?: string;
  isCollapsible?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'violent', label: 'Violent', color: '#ef4444' },
  { value: 'property', label: 'Property', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#3b82f6' },
] as const;

export function CrimeFilters({
  filters,
  onFiltersChange,
  incidentTypes = [],
  className,
  isCollapsible = false,
}: CrimeFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { data: neighborhoods } = useNeighborhoods();

  const handleDateRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: value as CrimeFiltersType['dateRange'],
    });
  };

  const handleCategoryToggle = (category: 'violent' | 'property' | 'other') => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : ['violent', 'property', 'other'],
    });
  };

  const handleNeighborhoodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      neighborhoodId: value === 'all' ? undefined : value,
    });
  };

  const handleIncidentTypeToggle = (type: string) => {
    const newTypes = filters.incidentTypes.includes(type)
      ? filters.incidentTypes.filter(t => t !== type)
      : [...filters.incidentTypes, type];
    
    onFiltersChange({
      ...filters,
      incidentTypes: newTypes,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: 'week',
      categories: ['violent', 'property', 'other'],
      incidentTypes: [],
      neighborhoodId: undefined,
    });
  };

  const hasActiveFilters = 
    filters.dateRange !== 'week' ||
    filters.categories.length < 3 ||
    filters.incidentTypes.length > 0 ||
    filters.neighborhoodId;

  const content = (
    <div className="space-y-6">
      {/* Date Range */}
      <div>
        <Label className="text-sm font-medium flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4" />
          Time Period
        </Label>
        <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Toggles */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Categories</Label>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map(category => (
            <div key={category.value} className="flex items-center gap-3">
              <Checkbox
                id={`category-${category.value}`}
                checked={filters.categories.includes(category.value)}
                onCheckedChange={() => handleCategoryToggle(category.value)}
              />
              <label
                htmlFor={`category-${category.value}`}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Neighborhood Filter */}
      <div>
        <Label className="text-sm font-medium flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4" />
          Neighborhood
        </Label>
        <Select 
          value={filters.neighborhoodId || 'all'} 
          onValueChange={handleNeighborhoodChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Neighborhoods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Neighborhoods</SelectItem>
            {neighborhoods?.map(neighborhood => (
              <SelectItem key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Incident Types */}
      {incidentTypes.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Incident Types</Label>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {incidentTypes.slice(0, 15).map(type => (
              <div key={type} className="flex items-center gap-3">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.incidentTypes.includes(type)}
                  onCheckedChange={() => handleIncidentTypeToggle(type)}
                />
                <label
                  htmlFor={`type-${type}`}
                  className="text-sm cursor-pointer truncate"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  if (isCollapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-4 py-3">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={cn('p-4', className)}>
      <h3 className="font-semibold text-card-foreground flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4" />
        Filters
      </h3>
      {content}
    </div>
  );
}
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CategoryWithSubs {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
}

interface CategoryTabsProps {
  hierarchy: CategoryWithSubs[];
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  selectedSubcategories: string[];
  onCategorySelect: (category: string) => void;
  onSubcategoryToggle: (subcategory: string) => void;
  isLoading: boolean;
}

const defaultIcons: Record<string, string> = {
  'restaurants': '🍽️',
  'shopping': '🛍️',
  'services': '🔧',
  'health': '💊',
  'beauty': '💅',
  'entertainment': '🎭',
};

export const CategoryTabs = ({
  hierarchy,
  categoryCounts,
  selectedCategory,
  selectedSubcategories,
  onCategorySelect,
  onSubcategoryToggle,
  isLoading,
}: CategoryTabsProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory || null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[120px] h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const handleCategoryClick = (slug: string) => {
    if (selectedCategory === slug) {
      // Clicking same category clears it
      onCategorySelect('');
      setExpandedCategory(null);
    } else {
      onCategorySelect(slug);
      setExpandedCategory(slug);
    }
  };

  const selectedParent = hierarchy.find(c => c.slug === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Parent Category Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* All button */}
        <button
          onClick={() => {
            onCategorySelect('');
            setExpandedCategory(null);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all',
            !selectedCategory
              ? 'bg-accent text-accent-foreground shadow-md'
              : 'bg-card hover:bg-muted border border-border'
          )}
        >
          <span>🏢</span>
          <span>All</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            !selectedCategory ? 'bg-accent-foreground/20' : 'bg-muted-foreground/20'
          )}>
            {totalCount}
          </span>
        </button>

        {hierarchy.map((category) => {
          const icon = category.icon || defaultIcons[category.slug] || '🏢';
          const count = categoryCounts[category.slug] || 0;
          const isSelected = selectedCategory === category.slug;
          const hasSubcategories = category.subcategories.length > 0;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all',
                isSelected
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'bg-card hover:bg-muted border border-border'
              )}
            >
              <span>{icon}</span>
              <span>{category.name}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isSelected ? 'bg-accent-foreground/20' : 'bg-muted-foreground/20'
              )}>
                {count}
              </span>
              {hasSubcategories && (
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  isSelected && 'rotate-180'
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategories Panel */}
      {selectedParent && selectedParent.subcategories.length > 0 && (
        <Collapsible open={!!expandedCategory}>
          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Filter by type
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedParent.subcategories.map((sub) => {
                  const isChecked = selectedSubcategories.includes(sub.slug);
                  const count = categoryCounts[sub.slug] || 0;

                  return (
                    <label
                      key={sub.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                        isChecked
                          ? 'bg-accent/20 border border-accent'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onSubcategoryToggle(sub.slug)}
                        className="hidden"
                      />
                      {isChecked && <Check className="w-4 h-4 text-accent" />}
                      <span className="text-sm">
                        {sub.icon || ''} {sub.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryShowcaseProps {
  categories: Tables<'business_categories'>[];
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isLoading: boolean;
}

const categoryIcons: Record<string, string> = {
  'restaurants': '🍽️',
  'food-drink': '🍔',
  'shopping': '🛍️',
  'services': '🔧',
  'health': '💊',
  'beauty': '💅',
  'fitness': '💪',
  'entertainment': '🎭',
  'nightlife': '🍸',
  'professional': '💼',
  'automotive': '🚗',
  'home': '🏠',
};

export const CategoryShowcase = ({
  categories,
  categoryCounts,
  selectedCategory,
  onCategorySelect,
  isLoading,
}: CategoryShowcaseProps) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="min-w-[140px] h-[100px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* All Categories */}
      <button
        onClick={() => onCategorySelect('')}
        className={`min-w-[140px] p-4 rounded-xl text-center transition-all duration-200 ${
          selectedCategory === ''
            ? 'bg-accent text-accent-foreground shadow-md'
            : 'bg-card hover:shadow-md shadow-sm'
        }`}
      >
        <span className="text-3xl block mb-2">🏢</span>
        <span className="font-medium text-sm block">All</span>
        <span className="text-xs text-muted-foreground">
          {Object.values(categoryCounts).reduce((a, b) => a + b, 0)} places
        </span>
      </button>

      {categories.map((category) => {
        const icon = category.icon || categoryIcons[category.slug] || '🏢';
        const count = categoryCounts[category.slug] || 0;
        const isSelected = selectedCategory === category.slug;

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.slug)}
            className={`min-w-[140px] p-4 rounded-xl text-center transition-all duration-200 ${
              isSelected
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-card hover:shadow-md shadow-sm'
            }`}
          >
            <span className="text-3xl block mb-2">{icon}</span>
            <span className="font-medium text-sm block truncate">{category.name}</span>
            <span className={`text-xs ${isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>
              {count} {count === 1 ? 'place' : 'places'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

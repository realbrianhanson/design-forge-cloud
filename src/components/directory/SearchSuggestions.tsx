import { Search } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: { name: string; category: string }[];
  onSuggestionClick: (query: string) => void;
}

export const SearchSuggestions = ({
  suggestions,
  onSuggestionClick,
}: SearchSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mt-4">
      <p className="text-sm text-muted-foreground mb-2">
        Did you mean...?
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.name}-${index}`}
            onClick={() => onSuggestionClick(suggestion.name)}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
          >
            <Search className="w-3 h-3 text-muted-foreground" />
            <span>{suggestion.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

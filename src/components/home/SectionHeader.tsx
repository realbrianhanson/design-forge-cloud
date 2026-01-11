import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
}

export const SectionHeader = ({ title, viewAllLink, viewAllText = 'View All' }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-primary">
        {title}
      </h2>
      {viewAllLink && (
        <Link 
          to={viewAllLink}
          className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          {viewAllText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

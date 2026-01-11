import { Link } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';

interface HeroSectionProps {
  article: Tables<'articles'> | null;
  isLoading: boolean;
}

export const HeroSection = ({ article, isLoading }: HeroSectionProps) => {
  if (isLoading) {
    return (
      <section className="section-spacing">
        <div className="container-news">
          <ArticleCardSkeleton variant="featured" />
        </div>
      </section>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <section className="section-spacing">
      <div className="container-news">
        <ArticleCard article={article} variant="featured" />
      </div>
    </section>
  );
};

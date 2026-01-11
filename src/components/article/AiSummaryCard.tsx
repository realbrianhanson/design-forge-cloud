import { Sparkles } from 'lucide-react';

interface AiSummaryCardProps {
  summary: string;
}

export const AiSummaryCard = ({ summary }: AiSummaryCardProps) => {
  return (
    <div className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-5 mt-8">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-accent uppercase tracking-wide">
          AI Summary
        </span>
      </div>
      <p className="text-foreground mt-2 leading-relaxed">
        {summary}
      </p>
      <p className="text-xs text-accent mt-3">
        This is an AI-generated summary to help you quickly understand the story.
      </p>
    </div>
  );
};

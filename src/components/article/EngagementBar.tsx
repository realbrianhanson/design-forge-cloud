import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EngagementBarProps {
  articleId: string;
  upvotes: number;
  commentCount: number;
  isLoggedIn: boolean;
  onCommentClick?: () => void;
}

export const EngagementBar = ({ 
  articleId, 
  upvotes, 
  commentCount, 
  isLoggedIn,
  onCommentClick 
}: EngagementBarProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVote = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to vote');
      return;
    }
    
    if (hasVoted) {
      setLocalUpvotes(prev => prev - 1);
      setHasVoted(false);
    } else {
      setLocalUpvotes(prev => prev + 1);
      setHasVoted(true);
    }
    // TODO: Implement actual vote mutation
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to save articles');
      return;
    }
    
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Article saved');
    // TODO: Implement actual save mutation
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?url=${url}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="flex items-center gap-3 flex-wrap mt-10 pt-6 border-t border-border">
      {/* Upvote Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVote}
            className={cn(
              "flex items-center gap-2 transition-colors",
              hasVoted 
                ? "text-accent bg-accent/10 hover:bg-accent/20" 
                : "text-muted-foreground hover:text-accent"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", hasVoted && "fill-current")} />
            <span>{localUpvotes}</span>
          </Button>
        </TooltipTrigger>
        {!isLoggedIn && (
          <TooltipContent>Sign in to vote</TooltipContent>
        )}
      </Tooltip>

      {/* Comment Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCommentClick}
        className="flex items-center gap-2 text-muted-foreground hover:text-accent"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{commentCount}</span>
      </Button>

      {/* Share Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:text-accent"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareTwitter}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareFacebook}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Share on Facebook
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 transition-colors ml-auto",
              isSaved 
                ? "text-accent" 
                : "text-muted-foreground hover:text-accent"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </Button>
        </TooltipTrigger>
        {!isLoggedIn && (
          <TooltipContent>Sign in to save</TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};

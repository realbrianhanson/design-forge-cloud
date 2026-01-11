import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeAgo } from '@/lib/articleUtils';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  body: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  articleId: string;
  comments: Comment[];
  commentCount: number;
  isLoggedIn: boolean;
  isLoading: boolean;
}

export const CommentsSection = ({ 
  articleId, 
  comments, 
  commentCount, 
  isLoggedIn,
  isLoading 
}: CommentsSectionProps) => {
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    // TODO: Implement comment submission
    setCommentText('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section id="comments" className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Discussion
          <span className="text-muted-foreground font-normal">
            ({commentCount} comments)
          </span>
        </h2>
        
        {/* Sort Toggle */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setSortBy('top')}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              sortBy === 'top' 
                ? "bg-muted text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Top
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              sortBy === 'newest' 
                ? "bg-muted text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Comment Input */}
      {isLoggedIn ? (
        <div className="flex gap-3 mb-8">
          <Avatar className="w-10 h-10">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={commentInputRef}
              placeholder="Share your thoughts..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="bg-accent hover:bg-accent/90"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-xl p-6 text-center mb-8">
          <p className="text-muted-foreground mb-3">
            Sign in to join the discussion
          </p>
          <Link to="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : sortedComments.length > 0 ? (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}
    </section>
  );
};

interface CommentItemProps {
  comment: Comment;
  isLoggedIn: boolean;
  isReply?: boolean;
}

const CommentItem = ({ comment, isLoggedIn, isReply = false }: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);

  return (
    <div className={cn("flex gap-3", isReply && "ml-12 mt-4")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={comment.author_avatar} />
        <AvatarFallback>
          {comment.author_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            {comment.author_name || 'Anonymous'}
          </span>
          <span className="text-muted-foreground">
            {formatTimeAgo(comment.created_at)}
          </span>
        </div>
        
        <p className="text-foreground mt-1 whitespace-pre-wrap">
          {comment.body}
        </p>
        
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors text-sm">
            <ThumbsUp className="w-3.5 h-3.5" />
            {comment.upvotes > 0 && <span>{comment.upvotes}</span>}
          </button>
          <button className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors text-sm">
            <ThumbsDown className="w-3.5 h-3.5" />
            {comment.downvotes > 0 && <span>{comment.downvotes}</span>}
          </button>
          {!isReply && (
            <button 
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors text-sm"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isLoggedIn={isLoggedIn} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSkeleton = () => (
  <div className="flex gap-3">
    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-3/4 mt-1" />
      <Skeleton className="h-4 w-24 mt-2" />
    </div>
  </div>
);

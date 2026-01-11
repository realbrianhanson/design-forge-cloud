import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  body: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  parent_id: string | null;
  replies?: Comment[];
}

// Fetch comments for an article
export const useArticleComments = (articleId: string) => {
  return useQuery({
    queryKey: ['comments', 'article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          body,
          author_id,
          upvotes,
          downvotes,
          created_at,
          parent_id
        `)
        .eq('content_type', 'article')
        .eq('content_id', articleId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organize into nested structure
      const commentsMap = new Map<string, Comment>();
      const topLevelComments: Comment[] = [];

      // First pass: create all comment objects
      data.forEach((comment) => {
        commentsMap.set(comment.id, {
          ...comment,
          author_name: 'Anonymous', // TODO: Join with user_profiles
          author_avatar: undefined,
          replies: [],
        });
      });

      // Second pass: organize into hierarchy
      data.forEach((comment) => {
        const commentObj = commentsMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          topLevelComments.push(commentObj);
        }
      });

      return topLevelComments;
    },
    enabled: !!articleId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Fetch comments for an event
export const useEventComments = (eventId: string) => {
  return useQuery({
    queryKey: ['comments', 'event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', 'event')
        .eq('content_id', eventId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};

// Fetch comments for a business
export const useBusinessComments = (businessId: string) => {
  return useQuery({
    queryKey: ['comments', 'business', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', 'business')
        .eq('content_id', businessId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
};

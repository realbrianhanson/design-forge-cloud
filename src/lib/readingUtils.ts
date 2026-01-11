// Estimate reading time from content
export const estimateReadingTime = (content: string | null): string => {
  if (!content) return '1 min read';
  
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return `${minutes} min read`;
};

// Format full date
export const formatFullDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Category styling helper
export const getCategoryStyles = (category: string): { bg: string; text: string } => {
  const categoryMap: Record<string, { bg: string; text: string }> = {
    local_news: { bg: 'bg-blue-50', text: 'text-blue-700' },
    local: { bg: 'bg-blue-50', text: 'text-blue-700' },
    crime: { bg: 'bg-red-50', text: 'text-red-700' },
    politics: { bg: 'bg-purple-50', text: 'text-purple-700' },
    business: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    sports: { bg: 'bg-orange-50', text: 'text-orange-700' },
    entertainment: { bg: 'bg-pink-50', text: 'text-pink-700' },
    weather: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
    traffic: { bg: 'bg-amber-50', text: 'text-amber-700' },
    food: { bg: 'bg-rose-50', text: 'text-rose-700' },
    health: { bg: 'bg-green-50', text: 'text-green-700' },
    education: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    community: { bg: 'bg-teal-50', text: 'text-teal-700' },
  };

  const normalized = category.toLowerCase().replace(/\s+/g, '_');
  return categoryMap[normalized] || { bg: 'bg-accent/10', text: 'text-accent' };
};

// Format time ago utility
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // Format as "Jan 15"
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format category for display
export const formatCategoryDisplay = (category: string): string => {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

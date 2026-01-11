import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event' | 'place';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
  structuredData?: object;
  noindex?: boolean;
}

const DEFAULT_TITLE = '904News - Jacksonville News, Events & Community';
const DEFAULT_DESCRIPTION = 'Your source for Jacksonville local news, events, business directory, and community. Stay connected with the 904.';
const DEFAULT_IMAGE = 'https://lovable.dev/opengraph-image-p98pqg.png'; // TODO: Replace with 904News branded image
const SITE_NAME = '904News';
const SITE_URL = 'https://904news.com';

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  article,
  structuredData,
  noindex = false,
}: SEOProps) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const pageImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'place' ? 'place' : type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:site" content="@904News" />

      {/* Article-specific */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.section && <meta property="article:section" content={article.section} />}

      {/* Structured Data / JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Helper functions to generate structured data

export const generateArticleSchema = (article: {
  title: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.title,
  description: article.description || '',
  image: article.image || DEFAULT_IMAGE,
  datePublished: article.publishedAt,
  dateModified: article.updatedAt || article.publishedAt,
  author: {
    '@type': 'Organization',
    name: article.author || SITE_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon.ico`,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${SITE_URL}${article.url}`,
  },
});

export const generateEventSchema = (event: {
  title: string;
  description?: string;
  image?: string;
  startTime: string;
  endTime?: string;
  locationName?: string;
  locationAddress?: string;
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.title,
  description: event.description || '',
  image: event.image || DEFAULT_IMAGE,
  startDate: event.startTime,
  endDate: event.endTime || event.startTime,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: event.locationName || 'Jacksonville, FL',
    address: {
      '@type': 'PostalAddress',
      streetAddress: event.locationAddress || '',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
  },
  offers: event.priceType === 'free' ? {
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  } : event.priceMin ? {
    '@type': 'Offer',
    lowPrice: event.priceMin,
    highPrice: event.priceMax || event.priceMin,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  } : undefined,
  organizer: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
});

export const generateLocalBusinessSchema = (business: {
  name: string;
  description?: string;
  image?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: business.name,
  description: business.description || '',
  image: business.image || DEFAULT_IMAGE,
  '@id': `${SITE_URL}${business.url}`,
  url: business.website || `${SITE_URL}${business.url}`,
  telephone: business.phone,
  priceRange: business.priceLevel ? '$'.repeat(business.priceLevel) : undefined,
  address: business.address ? {
    '@type': 'PostalAddress',
    streetAddress: business.address,
    addressLocality: business.city || 'Jacksonville',
    addressRegion: business.state || 'FL',
    postalCode: business.zipCode,
    addressCountry: 'US',
  } : undefined,
  aggregateRating: business.rating ? {
    '@type': 'AggregateRating',
    ratingValue: business.rating,
    reviewCount: business.reviewCount || 0,
    bestRating: 5,
    worstRating: 1,
  } : undefined,
});

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

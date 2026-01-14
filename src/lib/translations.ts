export type Language = 'en' | 'es';

// Define the translation structure type
type TranslationStructure = {
  nav: {
    news: string;
    events: string;
    businesses: string;
    neighborhoods: string;
    weather: string;
    signIn: string;
    signUp: string;
    profile: string;
    signOut: string;
  };
  categories: {
    localNews: string;
    crimeSafety: string;
    politics: string;
    business: string;
    sports: string;
    entertainment: string;
    weather: string;
    traffic: string;
  };
  news: {
    latestNews: string;
    stayInformed: string;
    all: string;
    local: string;
    crime: string;
    searchArticles: string;
    trending: string;
    noArticles: string;
    noArticlesCategory: string;
    noArticlesGeneral: string;
    tryDifferent: string;
    loadMore: string;
    loading: string;
  };
  newsletter: {
    title: string;
    subtitle: string;
    placeholder: string;
    subscribe: string;
    noSpam: string;
  };
  weather: {
    title: string;
    viewForecast: string;
    sunny: string;
    cloudy: string;
    rainy: string;
  };
  common: {
    search: string;
    openMenu: string;
    close: string;
    viewAll: string;
    readMore: string;
    minRead: string;
  };
  article: {
    breakingNews: string;
    featured: string;
    relatedArticles: string;
    comments: string;
    share: string;
  };
  footer: {
    aboutUs: string;
    contact: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
};

export const translations: Record<Language, TranslationStructure> = {
  en: {
    // Navigation
    nav: {
      news: 'News',
      events: 'Events',
      businesses: 'Businesses',
      neighborhoods: 'Neighborhoods',
      weather: 'Weather',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      profile: 'Profile',
      signOut: 'Sign Out',
    },
    // Category Navigation
    categories: {
      localNews: 'Local News',
      crimeSafety: 'Crime & Safety',
      politics: 'Politics',
      business: 'Business',
      sports: 'Sports',
      entertainment: 'Entertainment',
      weather: 'Weather',
      traffic: 'Traffic',
    },
    // News Page
    news: {
      latestNews: 'Latest News',
      stayInformed: "Stay informed with Jacksonville's top stories",
      all: 'All',
      local: 'Local',
      crime: 'Crime',
      searchArticles: 'Search articles...',
      trending: 'Trending',
      noArticles: 'No articles found',
      noArticlesCategory: 'No articles in the "{category}" category yet.',
      noArticlesGeneral: 'No articles available at the moment.',
      tryDifferent: 'Try a different category or check back later.',
      loadMore: 'Load More Articles',
      loading: 'Loading...',
    },
    // Newsletter
    newsletter: {
      title: 'Daily Jacksonville Digest',
      subtitle: 'Top stories delivered every morning',
      placeholder: 'Enter your email',
      subscribe: 'Subscribe',
      noSpam: 'No spam, ever. Unsubscribe anytime.',
    },
    // Weather
    weather: {
      title: 'Jacksonville Weather',
      viewForecast: 'View Forecast →',
      sunny: 'Sunny',
      cloudy: 'Cloudy',
      rainy: 'Rainy',
    },
    // Common
    common: {
      search: 'Search',
      openMenu: 'Open menu',
      close: 'Close',
      viewAll: 'View All',
      readMore: 'Read More',
      minRead: 'min read',
    },
    // Article
    article: {
      breakingNews: 'Breaking News',
      featured: 'Featured',
      relatedArticles: 'Related Articles',
      comments: 'Comments',
      share: 'Share',
    },
    // Footer
    footer: {
      aboutUs: 'About Us',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      copyright: '© 2024 904 News. All rights reserved.',
    },
  },
  es: {
    // Navigation
    nav: {
      news: 'Noticias',
      events: 'Eventos',
      businesses: 'Negocios',
      neighborhoods: 'Barrios',
      weather: 'Clima',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      profile: 'Perfil',
      signOut: 'Cerrar Sesión',
    },
    // Category Navigation
    categories: {
      localNews: 'Noticias Locales',
      crimeSafety: 'Crimen y Seguridad',
      politics: 'Política',
      business: 'Negocios',
      sports: 'Deportes',
      entertainment: 'Entretenimiento',
      weather: 'Clima',
      traffic: 'Tráfico',
    },
    // News Page
    news: {
      latestNews: 'Últimas Noticias',
      stayInformed: 'Mantente informado con las principales historias de Jacksonville',
      all: 'Todo',
      local: 'Local',
      crime: 'Crimen',
      searchArticles: 'Buscar artículos...',
      trending: 'Tendencias',
      noArticles: 'No se encontraron artículos',
      noArticlesCategory: 'No hay artículos en la categoría "{category}" todavía.',
      noArticlesGeneral: 'No hay artículos disponibles en este momento.',
      tryDifferent: 'Prueba una categoría diferente o vuelve más tarde.',
      loadMore: 'Cargar Más Artículos',
      loading: 'Cargando...',
    },
    // Newsletter
    newsletter: {
      title: 'Resumen Diario de Jacksonville',
      subtitle: 'Las mejores historias cada mañana',
      placeholder: 'Ingresa tu correo',
      subscribe: 'Suscribirse',
      noSpam: 'Sin spam, nunca. Cancela cuando quieras.',
    },
    // Weather
    weather: {
      title: 'Clima de Jacksonville',
      viewForecast: 'Ver Pronóstico →',
      sunny: 'Soleado',
      cloudy: 'Nublado',
      rainy: 'Lluvioso',
    },
    // Common
    common: {
      search: 'Buscar',
      openMenu: 'Abrir menú',
      close: 'Cerrar',
      viewAll: 'Ver Todo',
      readMore: 'Leer Más',
      minRead: 'min de lectura',
    },
    // Article
    article: {
      breakingNews: 'Noticia de Última Hora',
      featured: 'Destacado',
      relatedArticles: 'Artículos Relacionados',
      comments: 'Comentarios',
      share: 'Compartir',
    },
    // Footer
    footer: {
      aboutUs: 'Sobre Nosotros',
      contact: 'Contacto',
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio',
      copyright: '© 2024 904 News. Todos los derechos reservados.',
    },
  },
};

export type Translations = TranslationStructure;

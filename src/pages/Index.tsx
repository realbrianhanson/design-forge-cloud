import { Layout } from '@/components/layout/Layout';

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="section-spacing border-b border-border">
        <div className="container-news">
          <div className="max-w-3xl">
            <span className="text-label text-accent mb-3 block">Jacksonville's Premier News Source</span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-primary mb-4">
              Stay Connected to Your Community
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Breaking news, local events, business updates, and everything that matters to Jacksonville. 
              Your trusted source for community journalism.
            </p>
          </div>
        </div>
      </section>

      {/* Content Placeholder */}
      <section className="section-spacing">
        <div className="container-news">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
              <div className="card-premium p-6 animate-fade-in">
                <span className="category-pill bg-accent/10 text-accent mb-3">Local News</span>
                <h2 className="text-xl font-semibold text-primary mb-2">
                  Featured Story Coming Soon
                </h2>
                <p className="text-muted-foreground">
                  The 904News platform is being built. Soon you'll see the latest headlines, 
                  breaking news, and stories that matter to Jacksonville right here.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card-premium p-5 hover-lift" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="aspect-video bg-surface rounded-md mb-4"></div>
                    <span className="text-label text-accent">Category</span>
                    <h3 className="text-base font-medium text-primary mt-1 mb-2">
                      Story Headline {i}
                    </h3>
                    <p className="text-meta">
                      Brief description of the news story goes here...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="card-premium p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-4">
                  Trending Now
                </h3>
                <ul className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex gap-3 group cursor-pointer">
                      <span className="text-2xl font-bold text-accent/30 group-hover:text-accent transition-colors duration-200">
                        {i}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors duration-200">
                          Trending story headline goes here
                        </p>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-premium p-6 bg-accent text-accent-foreground">
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  Get Daily Updates
                </h3>
                <p className="text-sm opacity-90 mb-4">
                  Subscribe to our newsletter for the latest Jacksonville news.
                </p>
                <button className="w-full py-2.5 px-4 bg-white text-accent font-medium rounded-md hover:bg-white/90 transition-colors duration-200">
                  Subscribe Now
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

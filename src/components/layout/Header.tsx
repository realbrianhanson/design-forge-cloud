import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mainNavLinks = [
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'Community', href: '/community' },
  { label: 'Sports', href: '/sports' },
];

const categoryLinks = [
  { label: 'Local News', href: '/category/local' },
  { label: 'Crime & Safety', href: '/category/crime-safety' },
  { label: 'Politics', href: '/category/politics' },
  { label: 'Business', href: '/category/business' },
  { label: 'Sports', href: '/category/sports' },
  { label: 'Entertainment', href: '/category/entertainment' },
  { label: 'Weather', href: '/category/weather' },
  { label: 'Traffic', href: '/category/traffic' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={`sticky top-0 z-50 bg-background transition-shadow duration-200 ${isScrolled ? 'shadow-header' : ''}`}>
      {/* Main Header */}
      <div className="border-b border-border/50">
        <div className="container-news">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-baseline gap-0.5 group">
              <span className="text-2xl md:text-[28px] font-bold text-accent transition-colors duration-200">
                904
              </span>
              <span className="text-2xl md:text-[28px] font-bold text-primary transition-colors duration-200">
                NEWS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[15px] font-medium transition-colors duration-200 ${
                    location.pathname === link.href
                      ? 'text-accent'
                      : 'text-muted-foreground hover:text-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                className="p-2 text-muted-foreground hover:text-accent transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                to="/signin"
                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200"
              >
                Sign In
              </Link>

              <Button
                variant="default"
                size="sm"
                className="hidden sm:inline-flex bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-5"
              >
                Subscribe
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-accent transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-surface border-b border-border/30">
        <div className="container-news">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === link.href
                    ? 'text-accent bg-accent/5'
                    : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="container-news py-4">
            <nav className="flex flex-col gap-1">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === link.href
                      ? 'text-accent bg-accent/5'
                      : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <Link
                to="/signin"
                className="px-4 py-3 text-base font-medium text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-md transition-colors duration-200"
              >
                Sign In
              </Link>
              <Button
                variant="default"
                className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
              >
                Subscribe
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

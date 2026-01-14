import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSearchModal } from '@/hooks/useSearchModal';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import logo from '@/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { openSearch } = useSearchModal();
  const { t } = useLanguage();

  // Define navigation links using translations
  const mainNavLinks = [
    { label: t.nav.news, href: '/news' },
    { label: t.nav.events, href: '/events' },
    { label: t.nav.businesses, href: '/businesses' },
    { label: t.nav.neighborhoods, href: '/neighborhoods' },
    { label: t.nav.weather, href: '/weather' },
  ];

  const categoryLinks = [
    { label: t.categories.localNews, href: '/news?category=local' },
    { label: t.categories.crimeSafety, href: '/news/crime' },
    { label: t.categories.politics, href: '/news?category=politics' },
    { label: t.categories.business, href: '/news?category=business' },
    { label: t.categories.sports, href: '/news?category=sports' },
    { label: t.categories.entertainment, href: '/news?category=entertainment' },
    { label: t.categories.weather, href: '/weather' },
    { label: t.categories.traffic, href: '/news?category=traffic' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className={`sticky top-0 z-40 bg-background transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Main Header */}
      <div className="border-b border-border/50">
        <div className="container-news">
          <div className="flex items-center justify-between h-14 md:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src={logo} 
                alt="904 News" 
                className="h-16 md:h-20 w-auto"
              />
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
            <div className="flex items-center gap-1 md:gap-3">
              {/* Language Toggle - Desktop */}
              <div className="hidden md:block">
                <LanguageToggle />
              </div>

              <button
                onClick={openSearch}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors duration-200"
                aria-label={`${t.common.search} (⌘K)`}
              >
                <Search className="w-5 h-5" />
              </button>
              <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                ⌘K
              </span>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        {t.nav.profile}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t.nav.signOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    to="/auth/signin"
                    className="hidden md:block text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
                    {t.nav.signIn}
                  </Link>

                  <Link to="/auth/signup" className="hidden md:block">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-5"
                    >
                      {t.nav.signUp}
                    </Button>
                  </Link>
                </>
              )}

              {/* Language Toggle - Mobile */}
              <div className="md:hidden">
                <LanguageToggle />
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors duration-200"
                onClick={onMenuClick}
                aria-label={t.common.openMenu}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar - Hidden on mobile */}
      <div className="hidden md:block bg-surface border-b border-border/30">
        <div className="container-news">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
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
    </header>
  );
}

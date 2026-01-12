import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Search, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSearchModal } from '@/hooks/useSearchModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavLinks = [
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'Neighborhoods', href: '/neighborhoods' },
  { label: 'Weather', href: '/weather' },
];

const categoryLinks = [
  { label: 'Local News', href: '/news?category=local' },
  { label: 'Crime & Safety', href: '/news/crime' },
  { label: 'Politics', href: '/news?category=politics' },
  { label: 'Business', href: '/news?category=business' },
  { label: 'Entertainment', href: '/news?category=entertainment' },
  { label: 'Weather', href: '/weather' },
];

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { openSearch } = useSearchModal();

  // Close drawer on navigation
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearchClick = () => {
    onClose();
    setTimeout(() => openSearch(), 100);
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-background shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="flex items-center" onClick={onClose}>
            <img src={logo} alt="904 News" className="h-8 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Button */}
        <div className="p-4">
          <button
            onClick={handleSearchClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="text-sm">Search news, events, businesses...</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* User Section (if logged in) */}
          {user && (
            <div className="px-4 py-3 border-b border-border">
              <Link
                to="/settings/profile"
                className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile?.display_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          )}

          {/* Main Links */}
          <nav className="p-4">
            <ul className="space-y-1">
              {mainNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-between px-4 py-4 rounded-lg font-medium transition-colors",
                      location.pathname === link.href
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Category Links */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-4">
              Categories
            </h3>
            <ul className="space-y-1">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={onClose}
                    className={cn(
                      "block px-4 py-3 rounded-lg text-sm transition-colors",
                      location.pathname === link.href
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-3 safe-area-bottom">
          {user ? (
            <Button
              variant="outline"
              className="w-full h-12 justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          ) : (
            <>
              <Link to="/auth/signin" onClick={onClose}>
                <Button variant="outline" className="w-full h-12">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup" onClick={onClose}>
                <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

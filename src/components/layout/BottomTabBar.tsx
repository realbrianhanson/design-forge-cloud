import { Link, useLocation } from 'react-router-dom';
import { Home, Newspaper, Calendar, Building2, User, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BottomTabBarProps {
  onMenuClick: () => void;
}

const tabs = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Newspaper, label: 'News', href: '/news' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Building2, label: 'Businesses', href: '/businesses' },
];

export function BottomTabBar({ onMenuClick }: BottomTabBarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors duration-200",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("w-5 h-5 mb-1", active && "fill-accent/20")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
        
        {/* Profile/Menu Tab */}
        {user ? (
          <Link
            to="/settings/profile"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors duration-200",
              location.pathname.startsWith('/settings') || location.pathname === '/profile'
                ? "text-accent"
                : "text-muted-foreground"
            )}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : (
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-[64px] text-muted-foreground transition-colors duration-200"
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
}

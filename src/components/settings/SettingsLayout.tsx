import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, MapPin, Bell, Settings, LogOut } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';

interface SettingsLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Profile', href: '/settings', icon: User },
  { label: 'Neighborhoods', href: '/settings/neighborhoods', icon: MapPin },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
  { label: 'Account', href: '/settings/account', icon: Settings },
];

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/signin?redirect=/settings');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/settings') {
      return location.pathname === '/settings' || location.pathname === '/settings/profile';
    }
    return location.pathname === href;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-surface">
        <div className="container-news py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="bg-card rounded-xl shadow-sm p-4">
                <h2 className="font-semibold text-primary px-3 mb-4">Settings</h2>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-muted text-primary'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-primary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="bg-card rounded-xl shadow-sm p-6 md:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

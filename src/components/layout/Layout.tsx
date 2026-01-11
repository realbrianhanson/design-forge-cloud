import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomTabBar } from './BottomTabBar';
import { MobileDrawer } from './MobileDrawer';

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export function Layout({ children, hideBottomNav = false }: LayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      {!hideBottomNav && (
        <BottomTabBar onMenuClick={() => setIsDrawerOpen(true)} />
      )}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

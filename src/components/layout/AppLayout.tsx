import { ReactNode } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { PageTransition } from '@/components/ui/loading/PageTransition';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <DesktopSidebar />
        {/* Content with left margin to account for fixed sidebar */}
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 pb-24 overflow-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <MobileNav />
      </div>
    </div>
  );
};

"use client";

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CXBCSidebar } from './CXBCSidebar';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import { Menu, Bell, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import logoSymbol from '@/assets/logo-symbol.jpeg';

interface CXBCLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const CXBCLayout = ({ children, title, subtitle }: CXBCLayoutProps) => {
  const { partner } = useCXBCAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Close mobile menu on navigation
  const handleSheetClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <CXBCSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-sidebar-background" onInteractOutside={handleSheetClose}>
                  <CXBCSidebar onNavigate={handleSheetClose} />
                </SheetContent>
              </Sheet>
              <img src={logoSymbol.src} alt="CourierX" className="h-8 w-8 rounded-lg" />
              <span className="font-typewriter font-bold">CXBC</span>
            </div>

            <div className="flex items-center gap-2">
              {partner && (
                <div className="text-right mr-2">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-sm font-bold">{formatCurrency(partner.wallet_balance)}</p>
                </div>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-6 border-b">
          <div>
            {title && <h1 className="text-2xl font-typewriter font-bold">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            {partner && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                <Store className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{partner.business_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Zone: {partner.zone.charAt(0).toUpperCase() + partner.zone.slice(1)}
                  </p>
                </div>
              </div>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


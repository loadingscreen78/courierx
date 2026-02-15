"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Truck,
  PlusCircle,
  Wallet,
  Menu,
  Pill,
  FileText,
  Gift,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { MobileMoreDrawer } from './MobileMoreDrawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isPrimary?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, href, isActive, isPrimary, onClick }: NavItemProps) => {
  const { lightTap, mediumTap } = useHaptics();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      mediumTap();
      onClick();
    } else {
      lightTap();
    }
  };

  if (isPrimary) {
    return (
      <button
        onClick={handleClick}
        className="flex flex-col items-center justify-center -mt-6"
      >
        <div className="flex items-center justify-center w-14 h-14 bg-destructive text-destructive-foreground rounded-full shadow-lg shadow-destructive/30 btn-press ring-4 ring-background">
          {icon}
        </div>
        <span className="text-[10px] font-semibold mt-1 text-foreground">{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 min-w-[60px] btn-press transition-colors",
        isActive 
          ? "text-destructive" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-colors",
        isActive && "bg-destructive/10"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};

const shipmentOptions = [
  {
    id: 'medicine',
    icon: Pill,
    title: 'Medicine',
    description: 'Ship prescription medicines, health supplements & medical supplies',
    href: '/book/medicine',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'document',
    icon: FileText,
    title: 'Documents',
    description: 'Send important documents, certificates & legal papers securely',
    href: '/book/document',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    id: 'gift',
    icon: Gift,
    title: 'Gifts & Samples',
    description: 'Ship personal gifts, product samples & care packages',
    href: '/book/gift',
    color: 'bg-pink-500/10 text-pink-600',
  },
];

export const MobileNav = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shipDrawerOpen, setShipDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { mediumTap } = useHaptics();

  const handleShipmentSelect = (href: string) => {
    mediumTap();
    setShipDrawerOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="sticky-nav safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <NavItem 
            icon={<Home className="h-5 w-5" />} 
            label="Home" 
            href="/dashboard"
            isActive={pathname === '/dashboard'} 
          />
          <NavItem 
            icon={<Truck className="h-5 w-5" />} 
            label="Track" 
            href="/shipments"
            isActive={pathname === '/shipments'}
          />
          <NavItem 
            icon={<PlusCircle className="h-6 w-6" />} 
            label="Ship" 
            href="#"
            isPrimary
            onClick={() => setShipDrawerOpen(true)}
          />
          <NavItem 
            icon={<Wallet className="h-5 w-5" />} 
            label="Wallet" 
            href="/wallet"
            isActive={pathname === '/wallet'}
          />
          <NavItem 
            icon={<Menu className="h-5 w-5" />} 
            label="More" 
            href="#"
            isActive={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          />
        </div>
      </nav>

      {/* Ship Options Drawer */}
      <Sheet open={shipDrawerOpen} onOpenChange={setShipDrawerOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-typewriter text-lg">What are you shipping?</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {shipmentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShipmentSelect(option.href)}
                className="w-full flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors btn-press text-left"
              >
                <div className={cn("p-3 rounded-xl", option.color)}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{option.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <MobileMoreDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
      />
    </>
  );
};

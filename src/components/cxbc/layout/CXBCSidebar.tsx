"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCXBCAuth } from '@/hooks/useCXBCAuth';
import {
  LayoutDashboard,
  Calculator,
  Package,
  Wallet,
  FileText,
  History,
  Settings,
  LogOut,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import logoSymbol from '@/assets/logo-symbol.jpeg';

interface CXBCSidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { to: '/cxbc', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/cxbc/rate-calculator', icon: Calculator, label: 'Rate Calculator' },
  { to: '/cxbc/book', icon: Package, label: 'New Booking' },
  { to: '/cxbc/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/cxbc/bills', icon: FileText, label: 'Customer Bills' },
  { to: '/cxbc/shipments', icon: History, label: 'Shipment History' },
  { to: '/cxbc/settings', icon: Settings, label: 'Settings' },
];

export const CXBCSidebar = ({ onNavigate }: CXBCSidebarProps) => {
  const pathname = usePathname();
  const { partner } = useCXBCAuth();
  const { signOut } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="desktop-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoSymbol.src} alt="CourierX" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="font-typewriter text-lg font-bold text-sidebar-foreground">CXBC</h1>
            <p className="text-xs text-sidebar-foreground/70">Partner Portal</p>
          </div>
        </div>
      </div>

      {/* Partner Info */}
      {partner && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Store className="h-4 w-4 text-sidebar-foreground/70" />
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {partner.business_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
          <div className="mt-3 p-2 rounded-lg bg-sidebar-accent">
            <p className="text-xs text-sidebar-foreground/70">Wallet Balance</p>
            <p className="text-lg font-bold text-sidebar-foreground">
              {formatCurrency(partner.wallet_balance)}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = item.end 
            ? pathname === item.to 
            : pathname.startsWith(item.to);
          
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};


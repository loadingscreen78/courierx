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
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logoSymbol from '@/assets/logo-symbol.jpeg';

interface CXBCSidebarProps {
  onNavigate?: () => void;
}

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/cxbc', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/cxbc/rate-calculator', icon: Calculator, label: 'Rate Calculator' },
      { to: '/cxbc/book', icon: Package, label: 'New Booking' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { to: '/cxbc/wallet', icon: Wallet, label: 'Wallet' },
      { to: '/cxbc/bills', icon: FileText, label: 'Customer Bills' },
    ]
  },
  {
    label: 'Manage',
    items: [
      { to: '/cxbc/shipments', icon: History, label: 'Shipment History' },
      { to: '/cxbc/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export const CXBCSidebar = ({ onNavigate }: CXBCSidebarProps) => {
  const pathname = usePathname();
  const { partner } = useCXBCAuth();
  const { signOut } = useAuth();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <aside className="desktop-sidebar">
      {/* Header */}
      <div className="px-5 py-5 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={logoSymbol.src} alt="CourierX" className="h-9 w-9 rounded-xl object-contain ring-1 ring-sidebar-border" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background" />
          </div>
          <div>
            <h1 className="font-typewriter text-lg font-bold text-sidebar-foreground leading-none">CXBC</h1>
            <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">Partner Portal</p>
          </div>
        </div>
      </div>

      {/* Partner Wallet Card */}
      {partner && (
        <div className="px-4 py-3 border-b border-sidebar-border/60">
          <div className="bg-gradient-to-br from-coke-red/20 to-red-900/10 rounded-2xl p-3.5 border border-coke-red/20">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-3.5 w-3.5 text-sidebar-foreground/60" />
              <span className="text-xs font-medium text-sidebar-foreground/70 truncate">{partner.business_name}</span>
              <div className="ml-auto flex items-center gap-1 bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span className="text-[9px] font-bold">Verified</span>
              </div>
            </div>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">Wallet Balance</p>
            <p className="font-typewriter text-xl font-bold text-sidebar-foreground mt-0.5">
              {formatCurrency(partner.wallet_balance)}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[10px] text-green-400">Active Partner</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                    )}
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-sidebar-primary/20 text-sidebar-primary" : ""
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-sidebar-primary/60 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border/60">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

"use client";

import { 
  Package, 
  Wallet, 
  FolderOpen, 
  HelpCircle,
  Truck,
  Send,
  LogOut,
  Home,
  FileEdit,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { useHaptics } from '@/hooks/useHaptics';
import logoSymbol from '@/assets/logo-symbol.jpeg';
import { useShipments } from '@/hooks/useShipments';
import { motion } from 'framer-motion';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: string;
}

const NavItem = ({ icon, label, href, isActive, badge }: NavItemProps) => {
  const { lightTap } = useHaptics();
  
  return (
    <Link
      href={href}
      onClick={() => lightTap()}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
        isActive 
          ? "bg-sidebar-accent text-sidebar-foreground" 
          : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      {/* Active left bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
      )}

      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0",
        isActive 
          ? "bg-sidebar-primary/20 text-sidebar-primary" 
          : "group-hover:bg-sidebar-accent/80"
      )}>
        {icon}
      </div>
      <span className="font-medium text-sm flex-1 truncate">{label}</span>
      {badge && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-sidebar-primary text-white rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
};

export const DesktopSidebar = () => {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { mediumTap, lightTap } = useHaptics();
  const { activeShipments } = useShipments();

  const handleSignOut = async () => {
    mediumTap();
    await signOut();
    router.push('/auth');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const isVerified = profile?.aadhaar_verified;

  const navGroups = [
    {
      label: 'Main',
      items: [
        { icon: <Home className="h-4 w-4" />, label: 'Dashboard', href: '/dashboard' },
        { icon: <Truck className="h-4 w-4" />, label: 'Track Shipments', href: '/shipments', badge: activeShipments.length > 0 ? String(activeShipments.length) : undefined },
        { icon: <Package className="h-4 w-4" />, label: 'History', href: '/history' },
        { icon: <FileEdit className="h-4 w-4" />, label: 'Saved Drafts', href: '/drafts' },
      ]
    },
    {
      label: 'Account',
      items: [
        { icon: <Wallet className="h-4 w-4" />, label: 'Wallet & Billing', href: '/wallet' },
        { icon: <FolderOpen className="h-4 w-4" />, label: 'My Vault', href: '/vault' },
        { icon: <HelpCircle className="h-4 w-4" />, label: 'Help & Support', href: '/support' },
      ]
    }
  ];

  return (
    <aside className="desktop-sidebar fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src={logoSymbol.src} 
              alt="CourierX" 
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-sidebar-border"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background" />
          </div>
          <div>
            <h1 className="font-typewriter text-lg font-bold text-sidebar-foreground tracking-tight leading-none">
              CourierX
            </h1>
            <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">Premium Logistics</p>
          </div>
        </div>
      </div>

      {/* New Shipment CTA */}
      <div className="px-4 py-3">
        <Link
          href="/new-shipment"
          onClick={() => mediumTap()}
          className="group relative flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-coke-red to-red-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-coke-red/25 hover:shadow-lg hover:shadow-coke-red/35 hover:brightness-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600" />
          <Send className="h-4 w-4 relative z-10" />
          <span className="relative z-10">New Shipment</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-sidebar-border/60">
        <Link
          href="/profile"
          onClick={() => lightTap()}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 mb-1",
            pathname === '/profile' 
              ? "bg-sidebar-accent" 
              : "hover:bg-sidebar-accent/50"
          )}
        >
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-coke-red to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-none">
              {displayName}
            </p>
            <div className="mt-1">
              <VerificationBadge isVerified={!!isVerified} size="sm" showLabel={true} />
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/30 shrink-0" />
        </Link>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

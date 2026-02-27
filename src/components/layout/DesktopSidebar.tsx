"use client";

import { 
  Package, 
  Wallet, 
  FolderOpen, 
  HelpCircle,
  Truck,
  PlusCircle,
  LogOut,
  Home,
  Send,
  Sparkles,
  FileEdit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { useHaptics } from '@/hooks/useHaptics';
import logoSymbol from '@/assets/logo-symbol.jpeg';
import { useShipments } from '@/hooks/useShipments';

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
        "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
        "hover:bg-sidebar-accent/80",
        "btn-press",
        isActive 
          ? "bg-sidebar-accent text-sidebar-primary shadow-lg shadow-sidebar-primary/10" 
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
      )}
    >
      {/* Active indicator with glow */}
      {isActive && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full shadow-lg shadow-sidebar-primary/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/5 to-transparent" />
        </>
      )}
      
      <div className={cn(
        "relative p-2 rounded-xl transition-all duration-300",
        isActive 
          ? "bg-sidebar-primary/20 text-sidebar-primary" 
          : "group-hover:bg-sidebar-accent group-hover:scale-110"
      )}>
        {icon}
      </div>
      <span className="font-medium flex-1 relative z-10">{label}</span>
      {badge && (
        <span className="relative px-2.5 py-1 text-xs font-bold bg-sidebar-primary text-sidebar-primary-foreground rounded-full">
          {badge}
          <span className="absolute inset-0 rounded-full bg-sidebar-primary animate-ping opacity-30" />
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

  return (
    <aside className="desktop-sidebar fixed left-0 top-0 z-40">
      {/* Logo Section with subtle gradient */}
      <div className="p-6 border-b border-sidebar-border bg-gradient-to-b from-sidebar-background to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img 
              src={logoSymbol.src} 
              alt="CourierX" 
              className="h-12 w-12 rounded-xl object-contain ring-2 ring-sidebar-border group-hover:ring-sidebar-primary/50 transition-all duration-300"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-sidebar-background">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" />
            </div>
          </div>
          <div>
            <h1 className="font-typewriter text-xl font-bold text-sidebar-foreground tracking-tight">
              CourierX
            </h1>
            <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Premium Logistics
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Button with enhanced styling */}
      <div className="p-4">
        <Link
          href="/new-shipment"
          onClick={() => mediumTap()}
          className="group relative flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground rounded-xl font-semibold btn-press transition-all duration-300 shadow-lg shadow-destructive/30 hover:shadow-xl hover:shadow-destructive/40 hover:scale-[1.02] overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Send className="h-5 w-5 relative z-10" />
          <span className="relative z-10">New Shipment</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        <NavItem 
          icon={<Home className="h-5 w-5" />} 
          label="Dashboard" 
          href="/dashboard"
          isActive={pathname === '/dashboard'}
        />
        <NavItem 
          icon={<Truck className="h-5 w-5" />} 
          label="Track Shipments" 
          href="/shipments"
          isActive={pathname === '/shipments'}
          badge={activeShipments.length > 0 ? String(activeShipments.length) : undefined}
        />
        <NavItem 
          icon={<Package className="h-5 w-5" />} 
          label="History" 
          href="/history"
          isActive={pathname === '/history'}
        />
        <NavItem 
          icon={<FileEdit className="h-5 w-5" />} 
          label="Saved Drafts" 
          href="/drafts"
          isActive={pathname === '/drafts'}
        />
        <NavItem 
          icon={<Wallet className="h-5 w-5" />} 
          label="Wallet & Billing" 
          href="/wallet"
          isActive={pathname === '/wallet'}
        />
        <NavItem 
          icon={<FolderOpen className="h-5 w-5" />} 
          label="My Vault" 
          href="/vault"
          isActive={pathname === '/vault'}
        />
        <NavItem 
          icon={<HelpCircle className="h-5 w-5" />} 
          label="Help & Escalation" 
          href="/support"
          isActive={pathname === '/support'}
        />
      </nav>

      {/* Footer - User Profile with enhanced styling */}
      <div className="p-4 border-t border-sidebar-border bg-gradient-to-t from-black/20 to-transparent">
        {/* Profile Link */}
        <Link
          href="/profile"
          onClick={() => lightTap()}
          className={cn(
            "group block p-3 rounded-xl transition-all duration-300 mb-3",
            pathname === '/profile' 
              ? "bg-sidebar-accent shadow-lg" 
              : "hover:bg-sidebar-accent/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-sidebar-primary via-red-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
              {displayName.charAt(0).toUpperCase()}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {displayName}
              </p>
              <VerificationBadge isVerified={!!isVerified} size="sm" showLabel={true} />
            </div>
          </div>
        </Link>
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 btn-press group"
        >
          <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};


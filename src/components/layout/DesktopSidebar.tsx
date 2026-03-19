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
  ChevronRight,
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
import { ModeSwitchLoader } from '@/components/ui/ModeSwitchLoader';
import { useShippingMode } from '@/contexts/ShippingModeContext';

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

// Bold mode card — clickable, no toggle widget
const SidebarModeCard = ({ isInternational, onClick, isSwitching }: { isInternational: boolean; onClick: () => void; isSwitching: boolean }) => (
  <motion.button
    onClick={onClick}
    disabled={isSwitching}
    whileTap={{ scale: 0.97 }}
    className={cn(
      "w-full rounded-2xl border p-3.5 transition-all duration-400 text-left group relative overflow-hidden",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      isInternational
        ? "bg-[#F40000]/8 border-[#F40000]/25 hover:bg-[#F40000]/12 hover:border-[#F40000]/40"
        : "bg-sidebar-accent/60 border-sidebar-border/60 hover:bg-sidebar-accent hover:border-sidebar-border"
    )}
  >
    {/* Subtle glow for international */}
    {isInternational && (
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#F40000]/10 rounded-full blur-xl pointer-events-none" />
    )}

    <div className="flex items-center gap-3 relative z-10">
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-300",
        isInternational
          ? "bg-[#F40000]/15"
          : "bg-sidebar-foreground/8"
      )}>
        {isInternational ? (
          // Globe with orbit ring — international
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#F40000]">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 3C12 3 8 7 8 12C8 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 3C12 3 16 7 16 12C16 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2"/>
            <path d="M4.5 16.5H19.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2"/>
          </svg>
        ) : (
          // Truck with India flag pin — domestic
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-sidebar-foreground/70">
            <path d="M1 3h13v13H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="5.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="18.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 3v13" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[11px] font-bold uppercase tracking-widest",
            isInternational ? "text-[#F40000]" : "text-sidebar-foreground/80"
          )}>
            {isInternational ? 'International' : 'Domestic'}
          </span>
          {/* Live dot */}
          <span className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isInternational ? "bg-[#F40000] animate-pulse" : "bg-sidebar-foreground/30"
          )} />
        </div>
        <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 leading-tight">
          {isInternational ? '150+ countries' : 'Across India'}
        </p>
      </div>

      {/* Switch hint */}
      <div className={cn(
        "text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border transition-all duration-200",
        isInternational
          ? "text-sidebar-foreground/30 border-sidebar-border/30 group-hover:text-sidebar-foreground/60 group-hover:border-sidebar-border/60"
          : "text-sidebar-foreground/30 border-sidebar-border/30 group-hover:text-sidebar-foreground/60 group-hover:border-sidebar-border/60"
      )}>
        Switch
      </div>
    </div>
  </motion.button>
);

export const DesktopSidebar = () => {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { mediumTap, lightTap } = useHaptics();
  const { activeShipments } = useShipments();
  const { mode, toggleMode, isSwitching } = useShippingMode();
  const isInternational = mode === 'international';

  const handleSignOut = async () => {
    mediumTap();
    await signOut();
    router.replace('/auth');
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

      {/* Shipping Mode Card */}
      <div className="px-4 pb-3">
        <SidebarModeCard
          isInternational={isInternational}
          onClick={toggleMode}
          isSwitching={isSwitching}
        />
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
      <ModeSwitchLoader visible={isSwitching} targetMode={mode} />
    </aside>
  );
};

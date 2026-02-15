"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ScanLine, 
  ClipboardCheck, 
  Truck, 
  Package,
  LogOut,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoMain from '@/assets/logo-main.jpeg';

const navItems = [
  { 
    title: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    end: true 
  },
  { 
    title: 'Inbound Station', 
    href: '/admin/inbound', 
    icon: ScanLine 
  },
  { 
    title: 'QC Workbench', 
    href: '/admin/qc', 
    icon: ClipboardCheck 
  },
  { 
    title: 'Outbound', 
    href: '/admin/outbound', 
    icon: Truck 
  },
  { 
    title: 'All Shipments', 
    href: '/admin/shipments', 
    icon: Package 
  },
  { 
    title: 'CXBC Partners', 
    href: '/admin/cxbc-partners', 
    icon: Briefcase,
    adminOnly: true
  },
  { 
    title: 'Role Management', 
    href: '/admin/roles', 
    icon: ShieldCheck,
    adminOnly: true
  },
];

interface AdminSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const AdminSidebar = ({ isMobile = false, onNavigate }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-[hsl(200,15%,30%)]">
        <div className="flex items-center gap-3">
          <img src={logoMain.src} alt="CourierX" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="font-typewriter font-bold text-lg">CourierX</h1>
            <p className="text-xs text-[hsl(50,20%,70%)]">Warehouse OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = item.end 
              ? pathname === item.href
              : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[hsl(0,98%,48%)] text-white shadow-lg'
                    : 'text-[hsl(50,20%,80%)] hover:bg-[hsl(200,18%,28%)] hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(200,15%,30%)]">
        <Button
          variant="ghost"
          className="w-full justify-start text-[hsl(50,20%,70%)] hover:bg-[hsl(200,18%,28%)] hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[hsl(200,18%,20%)] to-[hsl(200,18%,16%)] text-[hsl(50,20%,95%)]">
        {sidebarContent}
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-[hsl(200,18%,20%)] to-[hsl(200,18%,16%)] text-[hsl(50,20%,95%)] border-r border-[hsl(200,15%,30%)] z-40">
      {sidebarContent}
    </aside>
  );
};


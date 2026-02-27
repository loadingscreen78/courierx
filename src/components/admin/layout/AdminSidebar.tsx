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
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-900/20">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-white">Courier</span>
              <span className="text-red-500 text-sm align-top italic ml-0.5">X</span>
            </h1>
            <p className="text-xs text-gray-500">Warehouse OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
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
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-red-500 bg-red-500/10 border-r-4 border-red-500'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:bg-white/10 hover:text-white"
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
      <div className="h-full flex flex-col bg-[#16161a] text-white">
        {sidebarContent}
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-[#16161a] text-white border-r border-white/5 z-40">
      {sidebarContent}
    </aside>
  );
};

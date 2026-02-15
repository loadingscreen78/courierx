"use client";

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Menu, 
  LogOut, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoMain from '@/assets/logo-main.jpeg';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { profile, signOut } = useAuth();
  const { isAdmin, isWarehouseOperator } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin', className: 'bg-coke-red/10 text-coke-red border-coke-red/30' };
    if (isWarehouseOperator) return { label: 'Operator', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' };
    return { label: 'Staff', className: '' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          {/* Top Bar */}
          <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`font-typewriter ${roleBadge.className}`}>
                {roleBadge.label}
              </Badge>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium max-w-[150px] truncate">
                    {profile?.full_name || profile?.email || 'Admin'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile?.full_name || 'Admin User'}</span>
                    <span className="text-xs text-muted-foreground font-normal">{profile?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <AdminSidebar isMobile onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <img src={logoMain.src} alt="CourierX" className="h-8 w-8 rounded-lg" />
              <div>
                <span className="font-typewriter font-bold text-sm">CourierX</span>
                <Badge variant="outline" className={`ml-2 text-xs ${roleBadge.className}`}>
                  {roleBadge.label}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Mobile User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{profile?.full_name || 'Admin User'}</span>
                  <span className="text-xs text-muted-foreground font-normal">{profile?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

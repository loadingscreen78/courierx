"use client";

import { 
  User, 
  Package, 
  FolderOpen, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Shield,
  FileEdit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface MobileMoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

const DrawerItem = ({ icon, label, href, onClick, destructive }: DrawerItemProps) => {
  const router = useRouter();
  const { lightTap } = useHaptics();

  const handleClick = () => {
    lightTap();
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors btn-press ${
        destructive 
          ? 'text-destructive hover:bg-destructive/10' 
          : 'hover:bg-muted'
      }`}
    >
      <div className={`p-2 rounded-lg ${destructive ? 'bg-destructive/10' : 'bg-muted'}`}>
        {icon}
      </div>
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};

export const MobileMoreDrawer = ({ open, onOpenChange }: MobileMoreDrawerProps) => {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { mediumTap } = useHaptics();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const isVerified = profile?.aadhaar_verified;

  const handleSignOut = async () => {
    mediumTap();
    await signOut();
    router.push('/auth');
    onOpenChange(false);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-left">More Options</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4 space-y-2">
          {/* User Profile Card */}
          <div className="p-4 bg-muted/50 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <VerificationBadge isVerified={!!isVerified} size="sm" showLabel={true} />
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <DrawerItem
            icon={<User className="h-5 w-5" />}
            label="Profile & Settings"
            onClick={() => handleNavigate('/profile')}
          />
          <DrawerItem
            icon={<Package className="h-5 w-5" />}
            label="Shipment History"
            onClick={() => handleNavigate('/history')}
          />
          <DrawerItem
            icon={<FileEdit className="h-5 w-5" />}
            label="Saved Drafts"
            onClick={() => handleNavigate('/drafts')}
          />
          <DrawerItem
            icon={<FolderOpen className="h-5 w-5" />}
            label="My Vault"
            onClick={() => handleNavigate('/vault')}
          />
          <DrawerItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Help & Support"
            onClick={() => handleNavigate('/support')}
          />
          
          {/* Divider */}
          <div className="border-t my-4" />
          
          {/* Sign Out */}
          <DrawerItem
            icon={<LogOut className="h-5 w-5" />}
            label="Sign Out"
            onClick={handleSignOut}
            destructive
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

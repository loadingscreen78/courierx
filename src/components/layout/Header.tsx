"use client";

import { Wallet, Calculator, Bell, Globe, User, LogOut, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet, MIN_BALANCE_REQUIRED } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import logoMain from '@/assets/logo-main.jpeg';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { balance } = useWallet();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || profile?.phone_number || '';
  const isVerified = profile?.aadhaar_verified;
  const isLowBalance = balance < MIN_BALANCE_REQUIRED;

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={logoMain.src} 
            alt="CourierX" 
            className="h-10 w-auto object-contain"
          />
          <span className="hidden sm:block font-typewriter text-xl font-bold text-foreground">
            CourierX
          </span>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Wallet Balance - Enhanced */}
          <button
            onClick={() => router.push('/wallet')}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 btn-press ${
              isLowBalance 
                ? 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/15' 
                : 'bg-gradient-to-r from-muted/80 to-muted/50 hover:from-muted hover:to-muted/70 border border-border/50'
            }`}
          >
            {isLowBalance ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <div className="p-1 rounded-lg bg-green-500/10">
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</span>
              <span className={`font-typewriter text-sm font-bold ${isLowBalance ? 'text-destructive' : 'text-foreground'}`}>
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
            {isLowBalance && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            )}
          </button>

          {/* Quick Rate Calculator - Enhanced */}
          <Button 
            variant="outline" 
            size="sm" 
            className="btn-press gap-2 rounded-xl border-border/50 hover:border-coke-red/30 hover:bg-coke-red/5 transition-all duration-300"
            onClick={() => router.push('/rate-calculator')}
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden lg:inline">Rate Calculator</span>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile Wallet (shown on mobile/tablet) */}
          <button
            onClick={() => router.push('/wallet')}
            className={`relative md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 btn-press ${
              isLowBalance 
                ? 'bg-destructive/10 border border-destructive/30' 
                : 'bg-muted/50 border border-border/50'
            }`}
          >
            {isLowBalance && (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            )}
            <Wallet className={`h-3.5 w-3.5 ${isLowBalance ? 'text-destructive' : 'text-foreground'}`} />
            <span className={`font-typewriter text-xs font-bold ${isLowBalance ? 'text-destructive' : ''}`}>
              ₹{balance.toLocaleString('en-IN')}
            </span>
            {isLowBalance && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Selector */}
          <Button variant="ghost" size="icon" className="btn-press rounded-xl hover:bg-muted/80">
            <Globe className="h-5 w-5" />
          </Button>

          {/* Notifications - Enhanced */}
          <Button variant="ghost" size="icon" className="btn-press rounded-xl hover:bg-muted/80 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-coke-red rounded-full border-2 border-background">
              <span className="absolute inset-0 rounded-full bg-coke-red animate-ping opacity-50" />
            </span>
          </Button>

          {/* Profile Dropdown - Enhanced */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="btn-press rounded-xl hover:bg-muted/80 relative">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-coke-red to-red-600 flex items-center justify-center text-white text-sm font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                {isVerified !== undefined && (
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center ${isVerified ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {isVerified && <Sparkles className="h-2 w-2 text-white" />}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl p-2">
              <DropdownMenuLabel className="font-normal p-3 bg-muted/50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-coke-red to-red-600 flex items-center justify-center text-white font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">{displayEmail}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              {/* Verification Status */}
              <DropdownMenuItem className="cursor-default focus:bg-transparent rounded-lg">
                <VerificationBadge isVerified={!!isVerified} size="sm" />
              </DropdownMenuItem>
              
              {!isVerified && (
                <DropdownMenuItem onClick={() => router.push('/auth/kyc')} className="rounded-lg">
                  Complete KYC
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => router.push('/profile')} className="rounded-lg">
                Profile & Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};


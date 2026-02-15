import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
};

export const VerificationBadge = ({
  isVerified,
  size = 'md',
  showLabel = true,
  className,
}: VerificationBadgeProps) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.padding,
        config.gap,
        isVerified
          ? 'bg-success/10 text-success'
          : 'bg-destructive/10 text-destructive',
        className
      )}
    >
      {isVerified ? (
        <ShieldCheck className={config.icon} />
      ) : (
        <ShieldAlert className={config.icon} />
      )}
      {showLabel && (
        <span className={config.text}>
          {isVerified ? 'KYC Verified' : 'KYC Pending'}
        </span>
      )}
    </div>
  );
};
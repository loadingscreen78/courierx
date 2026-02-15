import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTabContentProps {
  children: ReactNode;
  tabKey: string;
  skeleton?: ReactNode;
  loadingDuration?: number;
  className?: string;
}

export const AnimatedTabContent = ({
  children,
  tabKey,
  skeleton,
  loadingDuration = 150,
  className,
}: AnimatedTabContentProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsVisible(false);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDuration);

    const visibleTimer = setTimeout(() => {
      setIsVisible(true);
    }, loadingDuration + 50);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(visibleTimer);
    };
  }, [tabKey, loadingDuration]);

  if (isLoading && skeleton) {
    return <div className="animate-fade-in">{skeleton}</div>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-smooth',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {children}
    </div>
  );
};

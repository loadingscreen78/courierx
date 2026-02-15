import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface BookingProgressProps {
  steps: Step[];
  currentStep: number;
}

export const BookingProgress = ({ steps, currentStep }: BookingProgressProps) => {
  return (
    <div className="relative">
      {/* Desktop Progress */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-typewriter font-bold text-sm transition-all duration-300",
                  currentStep > step.id
                    ? "bg-accent text-accent-foreground"
                    : currentStep === step.id
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 mt-[-24px]">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    currentStep > step.id ? "bg-accent" : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-destructive transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

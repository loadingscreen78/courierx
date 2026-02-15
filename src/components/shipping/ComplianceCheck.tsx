import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ComplianceIssue } from '@/hooks/useComplianceCheck';

interface ComplianceCheckProps {
  issues: ComplianceIssue[];
  className?: string;
  showSuccess?: boolean;
}

export const ComplianceCheck = ({ 
  issues, 
  className,
  showSuccess = true,
}: ComplianceCheckProps) => {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  if (issues.length === 0 && showSuccess) {
    return (
      <Alert className={cn('border-candlestick-green/50 bg-candlestick-green/10', className)}>
        <CheckCircle className="h-4 w-4 text-candlestick-green" />
        <AlertTitle className="text-candlestick-green">Compliance check passed</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Your shipment meets all regulatory requirements for this destination.
        </AlertDescription>
      </Alert>
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {errors.map((issue, index) => (
        <Alert key={`error-${index}`} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Shipping blocked</AlertTitle>
          <AlertDescription>
            <p>{issue.message}</p>
            {issue.details && (
              <p className="mt-1 text-sm opacity-80">{issue.details}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {warnings.map((issue, index) => (
        <Alert key={`warning-${index}`} className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600">Warning</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            <p>{issue.message}</p>
            {issue.details && (
              <p className="mt-1 text-sm opacity-80">{issue.details}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {infos.map((issue, index) => (
        <Alert key={`info-${index}`} className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-600">Information</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            <p>{issue.message}</p>
            {issue.details && (
              <p className="mt-1 text-sm opacity-80">{issue.details}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

// Compact version for inline display
export const ComplianceCheckCompact = ({ 
  issues, 
  className,
}: Omit<ComplianceCheckProps, 'showSuccess'>) => {
  const hasErrors = issues.some(i => i.type === 'error');
  const hasWarnings = issues.some(i => i.type === 'warning');

  if (issues.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-candlestick-green', className)}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Compliant</span>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className={cn('flex items-center gap-2 text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{issues.filter(i => i.type === 'error').length} blocking issue(s)</span>
      </div>
    );
  }

  if (hasWarnings) {
    return (
      <div className={cn('flex items-center gap-2 text-amber-500', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">{issues.filter(i => i.type === 'warning').length} warning(s)</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-blue-500', className)}>
      <Info className="h-4 w-4" />
      <span className="text-sm">{issues.length} note(s)</span>
    </div>
  );
};

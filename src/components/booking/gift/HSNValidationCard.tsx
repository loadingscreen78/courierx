import { ValidationResult, ValidationIssue } from '@/lib/customs/validationService';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Shield, FileWarning, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HSNValidationCardProps {
  itemName: string;
  validation: ValidationResult;
  itemIndex: number;
}

const getStatusIcon = (status: ValidationResult['status']) => {
  switch (status) {
    case 'valid':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'restricted':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'prohibited':
      return <Ban className="h-5 w-5 text-destructive" />;
    case 'invalid':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
  }
};

const getStatusColor = (status: ValidationResult['status']) => {
  switch (status) {
    case 'valid':
      return 'border-green-500/50 bg-green-500/5';
    case 'restricted':
      return 'border-amber-500/50 bg-amber-500/5';
    case 'prohibited':
      return 'border-destructive/50 bg-destructive/5';
    case 'invalid':
      return 'border-destructive/50 bg-destructive/5';
  }
};

const getStatusLabel = (status: ValidationResult['status']) => {
  switch (status) {
    case 'valid':
      return 'Approved';
    case 'restricted':
      return 'Restricted';
    case 'prohibited':
      return 'Prohibited';
    case 'invalid':
      return 'Invalid';
  }
};

const getIssueIcon = (type: ValidationIssue['type']) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

export const HSNValidationCard = ({ itemName, validation, itemIndex }: HSNValidationCardProps) => {
  const { status, hsnInfo, issues, canProceed } = validation;

  return (
    <Card className={cn('transition-all duration-300', getStatusColor(status))}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              {getStatusIcon(status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">
                  Item {itemIndex + 1}: {itemName}
                </h4>
                <Badge 
                  variant={canProceed ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getStatusLabel(status)}
                </Badge>
              </div>
              {hsnInfo && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    HSN: <span className="font-mono font-semibold">{validation.hsnCode}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hsnInfo.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {hsnInfo.category}
                    </Badge>
                    {hsnInfo.requiresLicense && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        License Required
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-2 p-2.5 rounded-lg text-xs',
                  issue.type === 'error' && 'bg-destructive/10',
                  issue.type === 'warning' && 'bg-amber-500/10',
                  issue.type === 'info' && 'bg-blue-500/10'
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getIssueIcon(issue.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-0.5">{issue.title}</p>
                  <p className="text-muted-foreground">{issue.message}</p>
                  {issue.recommendation && (
                    <p className="mt-1 text-foreground font-medium">
                      💡 {issue.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success message */}
        {status === 'valid' && issues.length === 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">This item is approved for international shipping</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

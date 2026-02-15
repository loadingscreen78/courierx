'use client';

import { useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAllDrafts } from '@/hooks/useDraft';
import { formatRelativeTime, getProgressPercentage, Draft } from '@/lib/drafts/draftService';
import { FileText, Gift, Pill, Package, Trash2, ArrowRight, Clock, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const getTypeIcon = (type: Draft['type']) => {
  switch (type) {
    case 'gift': return <Gift className="h-5 w-5" />;
    case 'document': return <FileText className="h-5 w-5" />;
    case 'medicine': return <Pill className="h-5 w-5" />;
    case 'cxbc': return <Package className="h-5 w-5" />;
    default: return <FileText className="h-5 w-5" />;
  }
};

const getTypeLabel = (type: Draft['type']) => {
  switch (type) {
    case 'gift': return 'Gift Shipment';
    case 'document': return 'Document Shipment';
    case 'medicine': return 'Medicine Shipment';
    case 'cxbc': return 'CXBC Shipment';
    default: return 'Shipment';
  }
};

const getTypeRoute = (type: Draft['type']) => {
  switch (type) {
    case 'gift': return '/book/gift';
    case 'document': return '/book/document';
    case 'medicine': return '/book/medicine';
    case 'cxbc': return '/cxbc/book';
    default: return '/book';
  }
};

const getTypeColor = (type: Draft['type']) => {
  switch (type) {
    case 'gift': return 'text-pink-500 bg-pink-500/10';
    case 'document': return 'text-blue-500 bg-blue-500/10';
    case 'medicine': return 'text-green-500 bg-green-500/10';
    case 'cxbc': return 'text-orange-500 bg-orange-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
};

const Drafts = () => {
  const { drafts, remove, refresh } = useAllDrafts();
  const router = useRouter();

  // Debug: Log drafts
  useEffect(() => {
    console.log('[Drafts] All drafts:', drafts);
    console.log('[Drafts] Count:', drafts.length);
  }, [drafts]);

  const handleContinue = (draft: Draft) => {
    router.push(getTypeRoute(draft.type));
  };

  const handleDelete = (id: string) => {
    remove(id);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Saved Drafts</h1>
          <p className="text-muted-foreground text-sm">
            Continue where you left off on your shipment bookings
          </p>
        </div>

        {drafts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No Saved Drafts</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                When you start a booking and leave before completing, your progress will be saved here automatically.
              </p>
              <Button 
                className="mt-6"
                onClick={() => router.push('/new-shipment')}
              >
                Start New Shipment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => {
              const progress = getProgressPercentage(draft);
              const typeColor = getTypeColor(draft.type);
              
              return (
                <Card key={draft.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}>
                          {getTypeIcon(draft.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{draft.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {getTypeLabel(draft.type)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this draft. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(draft.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button size="sm" onClick={() => handleContinue(draft)}>
                          Continue
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Step {draft.currentStep} of {draft.totalSteps}
                          </span>
                          <span className="font-medium">{progress}% complete</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      
                      {/* Timestamps */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Last edited {formatRelativeTime(draft.updatedAt)}</span>
                        </div>
                        <span>•</span>
                        <span>Expires in {Math.ceil((new Date(draft.expiresAt).getTime() - Date.now()) / 86400000)} days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Drafts;

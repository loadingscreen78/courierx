import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Lock, Key, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';

export const SecurityTab = () => {
  const { user, signOut } = useAuth();
  const { balance } = useWallet();
  const { toast } = useToast();
  const { mediumTap, successFeedback, errorFeedback } = useHaptics();
  const { playSuccess, playError } = useSoundEffects();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      errorFeedback();
      playError();
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      errorFeedback();
      playError();
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    mediumTap();
    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsChangingPassword(false);

    if (error) {
      errorFeedback();
      playError();
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password.',
        variant: 'destructive',
      });
    } else {
      successFeedback();
      playSuccess();
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      errorFeedback();
      playError();
      toast({
        title: 'Confirmation Required',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    // In production, this would call a server function to handle account deletion
    toast({
      title: 'Account Deletion Requested',
      description: 'Your account deletion request has been submitted. You will receive a confirmation email.',
    });
    
    await signOut();
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={!newPassword || !confirmPassword || isChangingPassword}
            className="btn-press"
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Signed in as</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Last sign in</span>
              <span className="text-sm font-medium">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString()
                  : 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible account actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {balance > 0 && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="text-sm text-destructive font-medium">
                Your wallet contains ₹{balance.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Upon account deletion, this amount will be refunded within 14 business days to your registered bank account.
              </p>
            </div>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="btn-press gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action is <strong>permanent and irreversible</strong>. All your data, shipment history, and preferences will be deleted.
                  </p>
                  {balance > 0 && (
                    <p className="text-destructive">
                      Your wallet balance of ₹{balance.toLocaleString('en-IN')} will be refunded within 14 business days.
                    </p>
                  )}
                  <div className="pt-2">
                    <Label htmlFor="deleteConfirm" className="text-foreground">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteConfirmation !== 'DELETE'}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

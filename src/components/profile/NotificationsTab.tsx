import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, Megaphone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export const NotificationsTab = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { mediumTap, successFeedback, lightTap } = useHaptics();
  const { playSuccess, playClick } = useSoundEffects();
  
  const [emailNotifications, setEmailNotifications] = useState(profile?.notifications_email ?? true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(profile?.notifications_whatsapp ?? true);
  const [promotionalNotifications, setPromotionalNotifications] = useState(profile?.notifications_promotional ?? false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEmailNotifications(profile.notifications_email ?? true);
      setWhatsappNotifications(profile.notifications_whatsapp ?? true);
      setPromotionalNotifications(profile.notifications_promotional ?? false);
    }
  }, [profile]);

  const handleSave = async () => {
    mediumTap();
    setIsSaving(true);
    
    const { error } = await updateProfile({
      notifications_email: emailNotifications,
      notifications_whatsapp: whatsappNotifications,
      notifications_promotional: promotionalNotifications,
    });
    
    setIsSaving(false);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive',
      });
    } else {
      successFeedback();
      playSuccess();
      toast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved.',
      });
    }
  };

  const hasChanges = 
    emailNotifications !== (profile?.notifications_email ?? true) ||
    whatsappNotifications !== (profile?.notifications_whatsapp ?? true) ||
    promotionalNotifications !== (profile?.notifications_promotional ?? false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    return (checked: boolean) => {
      lightTap();
      playClick();
      setter(checked);
    };
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive shipment updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleToggle(setEmailNotifications)}
            />
          </div>

          {/* WhatsApp Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">WhatsApp Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via WhatsApp
                </p>
              </div>
            </div>
            <Switch
              checked={whatsappNotifications}
              onCheckedChange={handleToggle(setWhatsappNotifications)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            Marketing & Promotions
          </CardTitle>
          <CardDescription>
            Manage promotional communication preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div>
              <Label className="font-medium">Promotional Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive offers, discounts, and news
              </p>
            </div>
            <Switch
              checked={promotionalNotifications}
              onCheckedChange={handleToggle(setPromotionalNotifications)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Critical shipment alerts (QC failures, customs issues) will always be sent regardless of your preferences.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="btn-press gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

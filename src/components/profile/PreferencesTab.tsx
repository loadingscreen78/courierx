import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, DollarSign, MessageSquare, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'as', name: 'Assamese (অসমীয়া)' },
  { code: 'bn', name: 'Bangla (বাংলা)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar (+11% markup)' },
  { code: 'EUR', symbol: '€', name: 'Euro (+11% markup)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (+11% markup)' },
];

export const PreferencesTab = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { mediumTap, successFeedback, lightTap } = useHaptics();
  const { playSuccess, playClick } = useSoundEffects();
  
  const [language, setLanguage] = useState(profile?.preferred_language || 'en');
  const [currency, setCurrency] = useState(profile?.preferred_currency || 'INR');
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>(profile?.preferred_otp_method || 'email');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLanguage(profile.preferred_language || 'en');
      setCurrency(profile.preferred_currency || 'INR');
      setOtpMethod(profile.preferred_otp_method || 'email');
    }
  }, [profile]);

  const handleSave = async () => {
    mediumTap();
    setIsSaving(true);
    
    const { error } = await updateProfile({
      preferred_language: language,
      preferred_currency: currency,
      preferred_otp_method: otpMethod,
    });
    
    setIsSaving(false);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
    } else {
      successFeedback();
      playSuccess();
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved successfully.',
      });
    }
  };

  const hasChanges = 
    language !== (profile?.preferred_language || 'en') ||
    currency !== (profile?.preferred_currency || 'INR') ||
    otpMethod !== (profile?.preferred_otp_method || 'email');

  return (
    <div className="space-y-6">
      {/* Language Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            Language
          </CardTitle>
          <CardDescription>
            Choose your preferred language for the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={language} 
            onValueChange={(value) => {
              lightTap();
              playClick();
              setLanguage(value);
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Currency Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            Currency
          </CardTitle>
          <CardDescription>
            Select your preferred currency for display. Non-INR currencies include an 11% banking surcharge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={currency} 
            onValueChange={(value) => {
              lightTap();
              playClick();
              setCurrency(value);
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* OTP Method Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            OTP Delivery Method
          </CardTitle>
          <CardDescription>
            Choose how you&apos;d like to receive one-time passwords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={otpMethod} 
            onValueChange={(value: 'email' | 'whatsapp') => {
              lightTap();
              playClick();
              setOtpMethod(value);
            }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex-1 cursor-pointer">
                <span className="font-medium">Email OTP</span>
                <p className="text-sm text-muted-foreground">
                  Receive OTP via email
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="whatsapp" id="whatsapp" />
              <Label htmlFor="whatsapp" className="flex-1 cursor-pointer">
                <span className="font-medium">WhatsApp OTP</span>
                <p className="text-sm text-muted-foreground">
                  Receive OTP via WhatsApp message
                </p>
              </Label>
            </div>
          </RadioGroup>
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
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

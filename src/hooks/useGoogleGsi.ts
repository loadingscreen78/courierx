import { useEffect, useRef, useState, useCallback } from 'react';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface UseGoogleGsiOptions {
  enabled: boolean;
  onCredential: (idToken: string) => void;
  buttonDivRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
}

interface UseGoogleGsiReturn {
  isGsiReady: boolean;
  gsiError: string | null;
}

export function useGoogleGsi({
  enabled,
  onCredential,
  buttonDivRef,
  isLoading,
}: UseGoogleGsiOptions): UseGoogleGsiReturn {
  const [isGsiReady, setIsGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState<string | null>(null);
  const promptDismissedRef = useRef(false);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  const initializeGsi = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
      setGsiError('Google Client ID is not configured');
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: google.accounts.id.CredentialResponse) => {
        onCredentialRef.current(response.credential);
      },
      auto_select: true,
      cancel_on_tap_outside: true,
    });

    if (buttonDivRef.current) {
      google.accounts.id.renderButton(buttonDivRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: '100%',
      });
    }

    setIsGsiReady(true);
    setGsiError(null);
  }, [buttonDivRef]);

  // Load GSI script and initialize
  useEffect(() => {
    if (!enabled) {
      setIsGsiReady(false);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
      setGsiError('Google Client ID is not configured');
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      // Script already in DOM — if GSI is ready, initialize directly
      if (typeof google !== 'undefined' && google.accounts?.id) {
        initializeGsi();
      } else {
        // Script tag exists but hasn't finished loading yet
        existingScript.addEventListener('load', initializeGsi);
        existingScript.addEventListener('error', () => {
          setGsiError('Failed to load Google Sign-In library');
        });
      }
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeGsi();
    script.onerror = () => {
      setGsiError('Failed to load Google Sign-In library');
    };
    document.head.appendChild(script);
  }, [enabled, initializeGsi]);

  // One Tap prompt — only when ready and not loading
  useEffect(() => {
    if (!isGsiReady || isLoading || promptDismissedRef.current) return;

    google.accounts.id.prompt((notification: google.accounts.id.PromptNotification) => {
      if (notification.isDismissedMoment()) {
        promptDismissedRef.current = true;
      }
    });
  }, [isGsiReady, isLoading]);

  return { isGsiReady, gsiError };
}

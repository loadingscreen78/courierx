import { useEffect, useRef, useState, useCallback } from 'react';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface UseGoogleGsiOptions {
  enabled: boolean;
  onCredential: (idToken: string, nonce?: string) => void;
  buttonDivRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
}

interface UseGoogleGsiReturn {
  isGsiReady: boolean;
  gsiError: string | null;
}

/** Generate a cryptographically random nonce and return both raw and SHA-256 hashed versions */
async function generateNonce(): Promise<{ raw: string; hashed: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const raw = btoa(String.fromCharCode(...array));
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
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
  // Store the raw nonce so we can pass it to Supabase alongside the id_token
  const rawNonceRef = useRef<string | undefined>(undefined);

  const initializeGsi = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
      setGsiError('Google Client ID is not configured');
      return;
    }

    // Generate nonce — required to avoid the "nonce mismatch" error on Android Chrome (FedCM)
    const { raw, hashed } = await generateNonce();
    rawNonceRef.current = raw;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: google.accounts.id.CredentialResponse) => {
        // Pass both the id_token and the raw nonce to the caller
        onCredentialRef.current(response.credential, rawNonceRef.current);
      },
      nonce: hashed,
      auto_select: true,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    } as any);

    if (buttonDivRef.current) {
      const renderButton = () => {
        if (!buttonDivRef.current) return;
        const buttonWidth = buttonDivRef.current.offsetWidth || window.innerWidth - 64;
        google.accounts.id.renderButton(buttonDivRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: Math.min(buttonWidth, 400),
        });
      };

      if (buttonDivRef.current.offsetWidth > 0) {
        renderButton();
      } else {
        requestAnimationFrame(() => setTimeout(renderButton, 100));
      }
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
      setGsiError('Google Client ID is not configured');
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        initializeGsi();
      } else {
        existingScript.addEventListener('load', initializeGsi);
        existingScript.addEventListener('error', () => {
          setGsiError('Failed to load Google Sign-In library');
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeGsi();
    script.onerror = () => setGsiError('Failed to load Google Sign-In library');
    document.head.appendChild(script);
  }, [enabled, initializeGsi]);

  // One Tap prompt — show on all devices
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

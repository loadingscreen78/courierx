declare namespace google.accounts.id {
  interface IdConfiguration {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
  }

  interface CredentialResponse {
    credential: string;
    select_by: string;
    clientId?: string;
  }

  interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string | number;
    locale?: string;
  }

  interface PromptNotification {
    isNotDisplayed(): boolean;
    isSkippedMoment(): boolean;
    isDismissedMoment(): boolean;
    getNotDisplayedReason(): string;
    getSkippedReason(): string;
    getDismissedReason(): string;
  }

  function initialize(config: IdConfiguration): void;
  function renderButton(parent: HTMLElement, config: GsiButtonConfiguration): void;
  function prompt(callback?: (notification: PromptNotification) => void): void;
  function disableAutoSelect(): void;
}

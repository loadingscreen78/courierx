// Razorpay Checkout.js dynamic script loader

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let loadPromise: Promise<void> | null = null;

export function isRazorpayLoaded(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Razorpay;
}

export function loadRazorpayScript(): Promise<void> {
  if (isRazorpayLoaded()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

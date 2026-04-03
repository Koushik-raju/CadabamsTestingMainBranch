/**
 * Global type augmentation for the Razorpay web SDK.
 * Used by app/(public)/checkout/page.tsx and lib/capacitor/razorpay.ts.
 */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, handler: (response: Record<string, unknown>) => void): void;
    };
  }
}

export {};

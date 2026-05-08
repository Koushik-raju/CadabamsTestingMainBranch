/**
 * FILE: lib/capacitor/razorpay.ts
 *
 * PURPOSE:
 *   Razorpay payment integration via the web Standard Checkout script.
 *   Loads checkout.razorpay.com/v1/checkout.js on demand and opens the
 *   hosted payment modal. Works on both web and Capacitor WebView — no
 *   native plugin required.
 *
 * LOGIC OVERVIEW:
 *   1. loadRazorpayScript — injects the Razorpay script tag once and waits
 *      for it to resolve before any checkout attempt.
 *   2. openRazorpay (exported as openRazorpayNative for call-site compat) —
 *      calls loadRazorpayScript, builds the options object, opens the modal,
 *      and resolves the returned Promise on handler / ondismiss / payment.failed.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   RazorpayOptions   — input shape callers pass (key, amount, orderId, …)
 *   RazorpayResult    — { success, paymentId?, orderId?, error? }
 *   openRazorpayNative — entry point used by all callers
 *
 * DEPENDENCIES:
 *   window.Razorpay — injected by checkout.razorpay.com/v1/checkout.js
 *
 * LAST UPDATED: 2026-05-08 — removed @capacitor-community/razorpay native path; web-only
 */

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

async function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
}

export async function openRazorpayNative(options: RazorpayOptions): Promise<RazorpayResult> {
  try {
    await loadRazorpayScript();

    if (!window.Razorpay) {
      return { success: false, error: "Razorpay script failed to load" };
    }

    return new Promise<RazorpayResult>((resolve) => {
      const rzpOptions: Record<string, unknown> = {
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        order_id: options.orderId,
        name: options.name,
        description: options.description ?? "",
        prefill: {
          name: options.prefill?.name ?? "",
          email: options.prefill?.email ?? "",
          contact: options.prefill?.contact ?? "",
        },
        handler: (response: Record<string, unknown>) => {
          resolve({
            success: true,
            paymentId: response["razorpay_payment_id"] as string | undefined,
            orderId: response["razorpay_order_id"] as string | undefined,
          });
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, error: "Payment cancelled by user" });
          },
        },
      };

      const rzp = new window.Razorpay!(rzpOptions);
      rzp.on("payment.failed", (response: Record<string, unknown>) => {
        const err = response["error"] as Record<string, unknown> | undefined;
        resolve({
          success: false,
          error: (err?.["description"] as string | undefined) ?? "Payment failed",
        });
      });
      rzp.open();
    });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error opening Razorpay",
    };
  }
}

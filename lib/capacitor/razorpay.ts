/**
 * Razorpay payment integration.
 * On native: uses @capacitor-community/razorpay (dynamic import via eval to avoid TS module error).
 * On web: loads the Razorpay checkout script dynamically.
 */
import { isNative } from "./platform";

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

/**
 * Loads the Razorpay web checkout script if not already loaded.
 */
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

/**
 * Opens Razorpay checkout (native or web).
 */
export async function openRazorpayNative(options: RazorpayOptions): Promise<RazorpayResult> {
  const native = await isNative();
  if (native) {
    return openRazorpayCapacitor(options);
  }
  return openRazorpayWeb(options);
}

async function openRazorpayCapacitor(options: RazorpayOptions): Promise<RazorpayResult> {
  try {
    // @capacitor-community/razorpay is a native-only optional dependency.
    // Use Function constructor to avoid static analysis errors for unresolved module.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const mod = (await new Function('return import("@capacitor-community/razorpay")')()) as {
      RazorpayCheckout: {
        open: (opts: Record<string, unknown>) => Promise<Record<string, string>>;
      };
    };

    const result = await mod.RazorpayCheckout.open({
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
    });

    return {
      success: true,
      paymentId: result["razorpay_payment_id"],
      orderId: result["razorpay_order_id"],
    };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (errorMsg.toLowerCase().includes("cancel")) {
      return { success: false, error: "Payment cancelled by user" };
    }
    return { success: false, error: errorMsg };
  }
}

async function openRazorpayWeb(options: RazorpayOptions): Promise<RazorpayResult> {
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

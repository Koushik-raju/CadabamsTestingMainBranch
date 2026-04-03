declare module '@capacitor-community/razorpay' {
  interface RazorpayOpenOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    [key: string]: unknown;
  }

  interface RazorpayOpenResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    [key: string]: unknown;
  }

  export const RazorpayCheckout: {
    open(options: RazorpayOpenOptions): Promise<RazorpayOpenResult>;
  };
}

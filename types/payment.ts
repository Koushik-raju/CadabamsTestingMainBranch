export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
}

export interface PaymentCallback {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

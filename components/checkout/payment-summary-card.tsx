"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface PaymentSummaryCardProps {
  price: number | null;
}

export function PaymentSummaryCard({ price }: PaymentSummaryCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Payment summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Consultation fee</span>
          <span className="text-foreground">{price !== null ? `₹${price}` : "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform fee</span>
          <span className="text-foreground">₹0</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span>{price !== null ? `₹${price}` : "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

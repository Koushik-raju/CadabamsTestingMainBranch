/**
 * FILE: components/auth/account-not-found-modal.tsx
 *
 * PURPOSE:
 *   Dialog shown when the entered phone number has no associated account.
 *   Offers Cancel (close) or Sign Up (navigate to signup with pre-filled number).
 *
 * LOGIC OVERVIEW:
 *   Controlled dialog — open/onOpenChange forwarded from parent. onSignUp is
 *   called when the user chooses to proceed to signup.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AccountNotFoundModalProps — prop interface
 *   open         — controlled open state
 *   onOpenChange — dialog open/close handler
 *   onSignUp     — called when user taps Sign Up button
 *
 * DEPENDENCIES:
 *   shadcn/ui — Button, Dialog, DialogContent, DialogTitle
 *
 * LAST UPDATED: 2026-05-07 — extracted from login/page.tsx
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AccountNotFoundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
}

export function AccountNotFoundModal({ open, onOpenChange, onSignUp }: AccountNotFoundModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Account not found</DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          We couldn&apos;t find an account with this number. Would you like to sign up?
        </p>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onSignUp}>
            Sign Up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

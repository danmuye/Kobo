import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFinanceStore } from "@/store/finance";
import { computeAccountBalance } from "@/services/account-balance";
import { notify } from "@/services/notifications";
import { formatNaira } from "@/lib/format";
import type { Debt } from "@/types";

interface DebtPaymentDialogProps {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtPaymentDialog({ debt, open, onOpenChange }: DebtPaymentDialogProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [amount, setAmount] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [wallet, setWallet] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      map.set(a.name, computeAccountBalance(a, transactions));
    }
    return map;
  }, [accounts, transactions]);

  const currentBalance = selectedAccount ? balances.get(selectedAccount) ?? 0 : 0;
  const amountNum = Number(amount) || 0;
  const balanceError = amountNum > currentBalance ? `Insufficient balance (${formatNaira(currentBalance)} available)` : null;

  const reset = () => {
    setAmount("");
    setSelectedAccount("");
    setWallet("");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setTags("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!debt || !selectedAccount || !amount || amountNum <= 0 || balanceError) return;
    setSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (wallet.trim()) tagList.push(wallet.trim());

      addTransaction({
        date: new Date(date).toISOString(),
        description: `Payment to ${debt.name}`,
        category: "Debt Payment",
        account: selectedAccount,
        amount: amountNum,
        type: "expense",
        notes: notes || "",
        tags: tagList,
        debtId: debt.id,
      });

      notify.success("Payment recorded", `${formatNaira(amountNum)} paid toward ${debt.name}`, "debt");
      onOpenChange(false);
      reset();
    } catch {
      notify.error("Failed to record payment", "Please try again.", "debt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { reset(); onOpenChange(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make Payment{debt ? ` — ${debt.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount (₦)</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="How much are you paying?"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-account">Pay From Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger id="payment-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => {
                  const bal = balances.get(a.name) ?? 0;
                  return (
                    <SelectItem key={a.id} value={a.name}>
                      {a.name} — {formatNaira(bal)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground mt-1">
                Available balance: {formatNaira(currentBalance)}
                {balanceError && <span className="text-destructive ml-2">{balanceError}</span>}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-wallet">Wallet (optional)</Label>
            <Input
              id="payment-wallet"
              placeholder="e.g. PayPal"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes (optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Any notes about this payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-tags">Tags (optional, comma-separated)</Label>
            <Input
              id="payment-tags"
              placeholder="e.g. bonus, extra-payment"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedAccount || amountNum <= 0 || !!balanceError}
          >
            {submitting ? "Recording..." : "Make Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFinanceStore } from "@/store/finance";
import { computeAccountBalance } from "@/services/account-balance";
import { emitFinancialEvent } from "@/services/notifications";
import { formatNaira } from "@/lib/format";
import type { Goal } from "@/types";

interface GoalContributionDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalContributionDialog({ goal, open, onOpenChange }: GoalContributionDialogProps) {
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
    if (!goal || !selectedAccount || !amount || amountNum <= 0 || balanceError) return;
    setSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (wallet.trim()) tagList.push(wallet.trim());

      addTransaction({
        date: new Date(date).toISOString(),
        description: `Contribution to ${goal.name}`,
        category: "Savings Contribution",
        account: selectedAccount,
        amount: amountNum,
        type: "expense",
        notes: notes || "",
        tags: tagList,
        goalId: goal.id,
      });

      emitFinancialEvent("goal:contribution", goal.id, goal.name, amountNum);
      onOpenChange(false);
      reset();
    } catch {
      emitFinancialEvent("system:error", "goal-contribution", undefined, undefined, { detail: "Failed to add contribution" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { reset(); onOpenChange(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contribution{goal ? ` — ${goal.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="contribution-amount">Amount (₦)</Label>
            <Input
              id="contribution-amount"
              type="number"
              placeholder="How much are you contributing?"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-account">From Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger id="contribution-account">
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
            <Label htmlFor="contribution-wallet">Wallet (optional)</Label>
            <Input
              id="contribution-wallet"
              placeholder="e.g. PayPal"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-date">Date</Label>
            <Input
              id="contribution-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-notes">Notes (optional)</Label>
            <Textarea
              id="contribution-notes"
              placeholder="Any notes about this contribution"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-tags">Tags (optional, comma-separated)</Label>
            <Input
              id="contribution-tags"
              placeholder="e.g. bonus, side-hustle"
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
            {submitting ? "Adding..." : "Add Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, ReceiptText, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { Debt, Transaction } from "@/types";
import { getMatchingDebtTransactions, calculateDebtMetrics, getDebtStatus, debtStatusToneBg } from "@/services/debt-matching";

interface DebtPaymentsDrawerProps {
  debt: Debt | null;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtPaymentsDrawer({ debt, transactions, open, onOpenChange }: DebtPaymentsDrawerProps) {
  const matchingTxs = useMemo(
    () => debt ? getMatchingDebtTransactions(debt, transactions) : [],
    [debt, transactions],
  );

  const metrics = useMemo(
    () => debt ? calculateDebtMetrics(debt, transactions) : null,
    [debt, transactions],
  );

  const statusInfo = useMemo(
    () => metrics ? getDebtStatus(metrics.percentagePaid, metrics.isPaidOff, metrics.isOverdue) : null,
    [metrics],
  );

  const sorted = useMemo(
    () => [...matchingTxs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
    [matchingTxs],
  );

  if (!debt || !metrics || !statusInfo) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>{debt.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {debt.lender} &bull; {debt.debtType}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Original</p>
            <p className="mt-1 font-semibold">{formatNaira(debt.originalAmount)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</p>
            <p className="mt-1 font-semibold text-success">{formatNaira(metrics.amountPaid)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
            <p className={cn("mt-1 font-semibold", metrics.isPaidOff ? "text-success" : "text-foreground")}>
              {formatNaira(metrics.remainingBalance)}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="mt-1 font-semibold">{metrics.percentagePaid.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Minimum</p>
            <p className="mt-1 font-semibold">{formatNaira(debt.minimumPayment)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payments</p>
            <p className="mt-1 font-semibold">{metrics.paymentCount}</p>
          </div>
        </div>

        <div className="mb-4">
          <Badge className={cn("text-xs", debtStatusToneBg[statusInfo.value])} variant="secondary">
            {statusInfo.label}
          </Badge>
        </div>

        <h4 className="text-sm font-semibold mb-3">Repayment Transactions</h4>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ReceiptText className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No repayment transactions found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Transactions matching this debt's categories, accounts, wallets, or tags will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Description</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden sm:table-cell">Category</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Account</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden xl:table-cell">Merchant</th>
                  <th className="text-left font-medium px-4 py-2.5 hidden sm:table-cell">Date</th>
                  <th className="text-right font-medium px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                          t.type === "income" ? "bg-success/10 text-success" :
                          t.type === "transfer" ? "bg-primary/10 text-primary" :
                          "bg-destructive/10 text-destructive",
                        )}>
                          {t.type === "income" ? <ArrowUpRight className="h-3.5 w-3.5" /> :
                           t.type === "transfer" ? <ArrowLeftRight className="h-3.5 w-3.5" /> :
                           <ArrowDownRight className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{t.description}</span>
                          {t.merchant && <span className="ml-1 text-xs text-muted-foreground">@{t.merchant}</span>}
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {t.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 leading-3">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <Badge variant="secondary" className="font-normal text-xs">{t.category}</Badge>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                      {t.type === "transfer" ? `${t.fromAccount ?? ""} → ${t.toAccount ?? ""}` : t.account}
                    </td>
                    <td className="px-4 py-2.5 hidden xl:table-cell text-muted-foreground text-xs">
                      {t.merchant || "\u2014"}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground text-xs">{formatDate(t.date)}</td>
                    <td className={cn(
                      "px-4 py-2.5 text-right font-semibold text-sm",
                      t.type === "income" ? "text-success" : t.type === "transfer" ? "text-primary" : "text-foreground",
                    )}>
                      {t.type === "income" ? "+" : t.type === "transfer" ? "↔" : "−"}{formatNaira(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

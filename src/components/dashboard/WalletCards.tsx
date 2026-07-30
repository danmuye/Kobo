import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Landmark, Wallet, Banknote, CreditCard, TrendingUp, Smartphone, Building,
  PiggyBank, Target, DollarSign, ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import { useFinanceStore, getAccountsHealth, getMonthlyAccountSummary } from "@/store/finance";
import type { AccountHealth, MonthlyAccountSummaryEntry } from "@/store/finance";
import { computeBalances } from "@/services/account-balance";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark, building: Building, wallet: Wallet, banknote: Banknote,
  "credit-card": CreditCard, smartphone: Smartphone, "trending-up": TrendingUp,
  "piggy-bank": PiggyBank, target: Target, "dollar-sign": DollarSign,
};

const typeLabels: Record<AccountType, string> = {
  bank: "Bank", credit_card: "Credit Card", mobile_wallet: "Mobile Wallet",
  cash: "Cash", investment: "Investment",
};

const typeFallbackIcons: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  bank: Landmark, credit_card: CreditCard, mobile_wallet: Wallet,
  cash: Banknote, investment: TrendingUp,
};

const healthConfig = {
  active: { label: "Active", color: "text-success", bg: "bg-success/10" },
  low: { label: "Low", color: "text-warning", bg: "bg-warning/10" },
  inactive: { label: "Inactive", color: "text-muted-foreground", bg: "bg-muted/30" },
};

interface WalletCardProps {
  name: string;
  bank: string;
  type: AccountType;
  color: string;
  icon: string;
  balance: number;
  health: AccountHealth | undefined;
  monthly: MonthlyAccountSummaryEntry | undefined;
}

const WalletCard = memo(function WalletCard({
  name, bank, type, color, icon, balance, health, monthly,
}: WalletCardProps) {
  const Icon = iconMap[icon] ?? typeFallbackIcons[type] ?? Landmark;
  const hc = health ? healthConfig[health.activityLevel] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-foreground/10"
      role="article"
      aria-label={`Wallet: ${name}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground truncate">
              {bank}
            </p>
            <h3 className="text-sm font-semibold text-foreground truncate mt-0.5">
              {name}
            </h3>
          </div>
        </div>
        {hc && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0", hc.bg, hc.color)}>
            <Activity className="h-3 w-3" />
            {hc.label}
          </span>
        )}
      </div>

      <p className="font-display text-[30px] font-bold leading-none tracking-tight tabular-nums text-foreground">
        {formatNaira(balance)}
      </p>

      <div className="mt-3 flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
          {typeLabels[type]}
        </span>
        {health && health.growth !== 0 && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
            health.growth > 0 ? "text-success" : "text-destructive",
          )}>
            {health.growth > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(health.growth).toFixed(1)}%
          </span>
        )}
      </div>

      {monthly && (monthly.income > 0 || monthly.expenses > 0 || monthly.net !== 0) && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          {monthly.income > 0 && (
            <span className="flex items-center gap-1 text-success">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {formatNaira(monthly.income)}
            </span>
          )}
          {monthly.expenses > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <ArrowDownRight className="h-3.5 w-3.5" />
              {formatNaira(monthly.expenses)}
            </span>
          )}
          <span className="text-muted-foreground/60">
            {monthly.transactionCount} {monthly.transactionCount === 1 ? "txn" : "txns"}
          </span>
        </div>
      )}
    </motion.div>
  );
});

export const WalletCards = memo(function WalletCards() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);

  const balanceMap = useMemo(
    () => computeBalances(accounts, transactions),
    [accounts, transactions],
  );

  const accountHealth = useMemo(
    () => getAccountsHealth(accounts, transactions),
    [accounts, transactions],
  );

  const monthlySummary = useMemo(
    () => getMonthlyAccountSummary(accounts, transactions),
    [accounts, transactions],
  );

  const monthlyMap = useMemo(() => {
    const map = new Map<string, MonthlyAccountSummaryEntry>();
    for (const entry of monthlySummary) map.set(entry.accountName, entry);
    return map;
  }, [monthlySummary]);

  const healthMap = useMemo(() => {
    const map = new Map<string, AccountHealth>();
    for (const h of accountHealth) map.set(h.accountName, h);
    return map;
  }, [accountHealth]);

  if (accounts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {accounts.map((a) => (
        <WalletCard
          key={a.id}
          name={a.name}
          bank={a.bank}
          type={a.type}
          color={a.color}
          icon={a.icon}
          balance={balanceMap.get(a.id) ?? 0}
          health={healthMap.get(a.name)}
          monthly={monthlyMap.get(a.name)}
        />
      ))}
    </div>
  );
});

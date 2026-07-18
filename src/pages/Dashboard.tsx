import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Plus, ArrowUpRight, ArrowDownRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart as RPieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatDate } from "@/lib/format";
import { useDashboardMetrics } from "@/features/dashboard/hooks";
import { useBudgetsPage } from "@/features/budgets/hooks";
import { filterAndSortTransactions, paginateTransactions, type DashboardTransactionFilter, type DashboardTransactionSort } from "@/features/dashboard/utils";
import { useAuthContext } from "@/contexts/auth-context";

const COLORS = [
  "hsl(159 64% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)",
  "hsl(0 72% 55%)", "hsl(259 80% 60%)", "hsl(280 75% 65%)",
  "hsl(142 71% 45%)", "hsl(14 80% 60%)", "hsl(199 89% 48%)", "hsl(173 80% 40%)",
];

export default function Dashboard() {
  const { user } = useAuthContext();
  const greetingName = user?.displayName ?? user?.email?.split("@")[0] ?? "there";
  const { totalBalance, income, expenses, savings, monthlyChart, categoryData, cashFlow, totalSaved, totalTarget, monthlySavings, recentTransactions } = useDashboardMetrics();
  const transactions = recentTransactions;
  const { budgets: budgetsWithProgress } = useBudgetsPage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DashboardTransactionFilter>("all");
  const [sort, setSort] = useState<DashboardTransactionSort>("date-desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const stats = useMemo(() => ({ totalBalance, income, expenses, savings, totalSaved }), [expenses, income, savings, totalBalance, totalSaved]);

  const sparks = useMemo(() => {
    const incomes = monthlyChart.map((m) => m.income || 1);
    const expenses = monthlyChart.map((m) => m.expenses || 1);
    const balanceSeries = monthlyChart.map((_, i, arr) =>
      arr.slice(0, i + 1).reduce((s, m) => s + m.income - m.expenses, stats.totalBalance / 2),
    );
    const savingsSeries = monthlyChart.map((m) => Math.max(m.income - m.expenses, 0));
    const goalsSeries = monthlySavings.map((m) => m.contributions || 1);
    return { incomes, expenses, balanceSeries, savingsSeries, goalsSeries };
  }, [monthlyChart, stats.totalBalance, monthlySavings]);

  const filteredTransactions = useMemo(() => filterAndSortTransactions(transactions, query, filter, sort), [transactions, query, filter, sort]);
  const pagedTransactions = useMemo(() => paginateTransactions(filteredTransactions, page, pageSize), [filteredTransactions, page]);

  useEffect(() => {
    setPage(1);
  }, [query, filter, sort]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${greetingName}`}
        subtitle="Here's how your money is moving this month."
        action={
          <>
            <Button variant="outline" asChild>
              <Link to="/reports">View Reports</Link>
            </Button>
            <Button asChild>
              <Link to="/transactions"><Plus className="h-4 w-4 mr-1" /> New Transaction</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Balance" value={stats.totalBalance} delta={4.2} icon={Wallet} variant="balance" data={sparks.balanceSeries} />
        <StatCard label="Income (Month)" value={stats.income} delta={8.6} icon={TrendingUp} variant="income" data={sparks.incomes} />
        <StatCard label="Expenses (Month)" value={stats.expenses} delta={-3.1} icon={TrendingDown} variant="expense" data={sparks.expenses} />
        <StatCard label="Cash Saved (Month)" value={stats.savings} delta={12.4} icon={PiggyBank} variant="savings" data={sparks.savingsSeries} />
        <StatCard label="Total Saved" value={stats.totalSaved} delta={0} icon={Target} variant="goals" data={sparks.goalsSeries} />
      </section>

      {/* Charts row */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-elegant"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Income vs Expenses</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNaira(v, { compact: true })} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8, fontSize: 12,
                  }}
                  formatter={(v: number) => formatNaira(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(0 72% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5 shadow-elegant"
        >
          <h3 className="font-display font-semibold mb-1">Spending by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Top categories</p>
          <div className="h-56">
            <ResponsiveContainer>
              <RPieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8, fontSize: 12,
                  }}
                  formatter={(v: number) => formatNaira(v)}
                />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {categoryData.slice(0, 4).map((c, i) => (
              <li key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-medium text-muted-foreground">{formatNaira(c.value, { compact: true })}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5 shadow-elegant">
          <h3 className="font-display font-semibold mb-1">Monthly Expenses</h3>
          <p className="text-xs text-muted-foreground mb-4">Trend across 6 months</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNaira(v, { compact: true })} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatNaira(v)}
                />
                <Line type="monotone" dataKey="expenses" stroke="hsl(0 72% 55%)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5 shadow-elegant">
          <h3 className="font-display font-semibold mb-1">Cash Flow</h3>
          <p className="text-xs text-muted-foreground mb-4">Net income each month</p>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={cashFlow}>
                <defs>
                  <linearGradient id="cashflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(159 64% 45%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(159 64% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNaira(v, { compact: true })} />
                <Tooltip
                  animationDuration={200}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatNaira(v)}
                />
                <Area type="monotone" dataKey="cashFlow" stroke="hsl(159 64% 45%)" strokeWidth={3} fill="url(#cashflow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* Savings Contributions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-5 shadow-elegant"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold">Monthly Savings Contributions</h3>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatNaira(totalSaved)} saved of {formatNaira(totalTarget)} target
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={monthlySavings}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNaira(v, { compact: true })} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatNaira(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="contributions" name="Contributions" fill="hsl(280 75% 65%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Current Budgets */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Current Budgets</h2>
            <p className="text-sm text-muted-foreground">Track how each category is performing this month.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/budgets">Manage Budgets</Link>
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {budgetsWithProgress.slice(0, 8).map((b) => (
            <BudgetCard key={b.id} budget={b} metrics={b.metrics} />
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="rounded-xl border border-border bg-card shadow-elegant">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">Your latest activity.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transactions"
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring transition"
                aria-label="Search transactions"
              />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value as DashboardTransactionFilter)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as DashboardTransactionSort)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="amount-desc">Highest</option>
              <option value="amount-asc">Lowest</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Description</th>
                <th className="text-left font-medium px-5 py-3">Category</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Account</th>
                <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="text-right font-medium px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pagedTransactions.items.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <span className="font-medium">{t.description}</span>
                        <p className="text-xs text-muted-foreground">{t.type === "income" ? "Received" : "Spent"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary" className="font-normal">{t.category}</Badge>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{t.account}</td>
                  <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{formatDate(t.date)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "−"}{formatNaira(t.amount)}
                  </td>
                </tr>
              ))}
              {pagedTransactions.items.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No transactions match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Page {pagedTransactions.currentPage} of {pagedTransactions.totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(pagedTransactions.totalPages, p + 1))} disabled={page >= pagedTransactions.totalPages} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

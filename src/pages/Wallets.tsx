import { PageHeader } from "@/components/common/PageHeader";
import { AccountsView } from "./Accounts";

export default function Wallets() {
  return (
    <div className="space-y-6">
      <PageHeader title="Wallets" subtitle="Your digital wallets — Opay, Palmpay, and friends." />
      <AccountsView filterType="mobile_wallet" />
    </div>
  );
}

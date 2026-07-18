import { create } from "zustand";
import type { Transaction } from "@/types";

export type TransactionModalMode = "create" | "edit" | "duplicate";

interface TransactionModalState {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  mode: TransactionModalMode;

  open: (mode?: TransactionModalMode, transaction?: Transaction) => void;
  close: () => void;
}

export const useTransactionModal = create<TransactionModalState>()(
  (set) => ({
    isOpen: false,
    editingTransaction: null,
    mode: "create",

    open: (mode = "create", transaction = null) =>
      set({ isOpen: true, mode, editingTransaction: transaction }),

    close: () =>
      set({ isOpen: false, mode: "create", editingTransaction: null }),
  }),
);

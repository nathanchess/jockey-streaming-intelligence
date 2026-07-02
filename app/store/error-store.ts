import { create } from "zustand";
import { jockeyErrorCopy } from "@/lib/jockey-error-messages";

type ErrorState = {
  open: boolean;
  title: string;
  message: string;
  showError: (detail?: string, title?: string) => void;
  clearError: () => void;
};

export const useErrorStore = create<ErrorState>((set) => ({
  open: false,
  title: "",
  message: "",
  showError: (detail, title) => {
    const copy = jockeyErrorCopy(detail);
    set({
      open: true,
      title: title ?? copy.title,
      message: copy.message,
    });
  },
  clearError: () => set({ open: false, title: "", message: "" }),
}));

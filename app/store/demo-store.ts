import { create } from "zustand";
import type { ApiExchange, ViewerProfileId } from "@/lib/types";

type DemoState = {
  developerMode: boolean;
  settingsOpen: boolean;
  viewerProfileId: ViewerProfileId;
  lastApiExchange: ApiExchange | null;
  setDeveloperMode: (on: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setViewerProfileId: (id: ViewerProfileId) => void;
  setLastApiExchange: (exchange: ApiExchange | null) => void;
};

export const useDemoStore = create<DemoState>((set) => ({
  developerMode: false,
  settingsOpen: false,
  viewerProfileId: "feel_good_family",
  lastApiExchange: null,
  setDeveloperMode: (developerMode) => set({ developerMode }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setViewerProfileId: (viewerProfileId) => set({ viewerProfileId }),
  setLastApiExchange: (lastApiExchange) => set({ lastApiExchange }),
}));

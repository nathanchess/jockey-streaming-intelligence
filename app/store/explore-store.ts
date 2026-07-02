import { create } from "zustand";

type ExploreState = {
  activeQueryId: string | null;
  liveSessionId: string | null;
  setActiveQueryId: (id: string | null) => void;
  setLiveSessionId: (id: string | null) => void;
};

export const useExploreStore = create<ExploreState>((set) => ({
  activeQueryId: null,
  liveSessionId: null,
  setActiveQueryId: (activeQueryId) => set({ activeQueryId }),
  setLiveSessionId: (liveSessionId) => set({ liveSessionId }),
}));

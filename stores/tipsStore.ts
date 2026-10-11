import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SCREEN_TIPS, type TipScreen } from '../constants/tips';

const STORAGE_KEY = 'jodtod_tips_v1';

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TipsState {
  loaded: boolean;
  introSeen: boolean;
  seenScreens: TipScreen[];
  active: { screen: TipScreen; index: number } | null;
  rects: Record<string, AnchorRect>;
  load: () => Promise<void>;
  startTips: (screen: TipScreen) => void;
  next: () => void;
  // Ends the tour and remembers that this screen's tips were seen.
  finish: () => void;
  // Ends the tour without marking it seen, e.g. when the user leaves the screen.
  cancel: () => void;
  setAnchorRect: (id: string, rect: AnchorRect) => void;
  setIntroSeen: (seen: boolean) => void;
  resetTips: () => void;
}

const persist = (state: Pick<TipsState, 'introSeen' | 'seenScreens'>) => {
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({
    introSeen: state.introSeen,
    seenScreens: state.seenScreens,
  })).catch(() => {});
};

export const activeTip = (state: Pick<TipsState, 'active'>) =>
  state.active ? SCREEN_TIPS[state.active.screen][state.active.index] ?? null : null;

export const useTipsStore = create<TipsState>((set, get) => ({
  loaded: false,
  introSeen: false,
  seenScreens: [],
  active: null,
  rects: {},

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      set({
        loaded: true,
        introSeen: !!saved.introSeen,
        seenScreens: Array.isArray(saved.seenScreens) ? saved.seenScreens : [],
      });
    } catch {
      set({ loaded: true });
    }
  },

  startTips: (screen) => {
    if (SCREEN_TIPS[screen].length === 0) return;
    set({ active: { screen, index: 0 }, rects: {} });
  },

  next: () => {
    const { active } = get();
    if (!active) return;
    if (active.index + 1 < SCREEN_TIPS[active.screen].length) {
      set({ active: { ...active, index: active.index + 1 } });
    } else {
      get().finish();
    }
  },

  finish: () => {
    const { active, seenScreens } = get();
    if (!active) return;
    const nextSeen = seenScreens.includes(active.screen) ? seenScreens : [...seenScreens, active.screen];
    set({ active: null, seenScreens: nextSeen });
    persist({ introSeen: get().introSeen, seenScreens: nextSeen });
  },

  cancel: () => set({ active: null }),

  setAnchorRect: (id, rect) => set((state) => ({ rects: { ...state.rects, [id]: rect } })),

  setIntroSeen: (seen) => {
    set({ introSeen: seen });
    persist({ introSeen: seen, seenScreens: get().seenScreens });
  },

  resetTips: () => {
    set({ seenScreens: [] });
    persist({ introSeen: get().introSeen, seenScreens: [] });
  },
}));

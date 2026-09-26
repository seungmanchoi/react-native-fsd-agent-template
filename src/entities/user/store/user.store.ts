import { create } from 'zustand';
import { tokenManager } from '@shared/api';
import { IUser } from '../types';

interface IUserState {
  user: IUser | null;
  isAuthenticated: boolean;
  setUser: (user: IUser) => void;
  /** Local state only — use when the tokens are already gone (e.g. refresh failed). */
  clearUser: () => void;
  /** Deletes the SecureStore tokens, then clears the user. */
  logout: () => Promise<void>;
}

export const useUserStore = create<IUserState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user: IUser) =>
    set({
      user,
      isAuthenticated: true,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),

  logout: async () => {
    try {
      await tokenManager.clearTokens();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

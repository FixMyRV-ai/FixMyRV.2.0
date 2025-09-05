import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';
interface UserState {
  user: User | null;
  token: string | null;
  credits?: number;
  setCredits: (credits: number) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updateUser: (userData: Partial<User>) => void;
  clearUser: () => void;
}

const authSlice = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      credits: 0,
      setCredits: (credits: number) => set({ credits }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      clearUser: () => set({ user: null, token: null }),
    }),
    {
      name: 'user',
    }
  )
);

export default authSlice;
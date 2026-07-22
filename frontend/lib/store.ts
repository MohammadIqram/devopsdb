import { create } from 'zustand';
import { axiosInstance } from './axios';

export interface Repository {
  id: string | number;
  name: string;
}

interface RepoState {
  repos: Repository[];
  selectedRepo: string;
  loading: boolean;
  error: string | null;
  setSelectedRepo: (repoName: string) => void;
  fetchRepos: () => Promise<void>;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repos: [],
  selectedRepo: '',
  loading: false,
  error: null,
  setSelectedRepo: (repoName: string) => set({ selectedRepo: repoName }),
  fetchRepos: async () => {
    // If repos are already loaded, do not fetch again
    if (get().repos.length > 0) return;

    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Repository[]>('/repo');
      console.log('this is a data fetched form the repo: ', data);
      if (Array.isArray(data)) {
        set({ repos: data });
        if (data.length > 0 && !get().selectedRepo) {
          set({ selectedRepo: data[0].name });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch repositories in store:', err);
      set({ error: err.message || 'Failed to fetch repositories' });
    } finally {
      set({ loading: false });
    }
  },
}));

export type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, rememberMe = false) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erreur lors de la connexion');
          }

          const { user, token } = await response.json();

          set({
            user,
            token,
            isLoading: false,
          });

          // Configurer le token pour les futures requêtes
          if (token) {
            localStorage.setItem('token', token);
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erreur lors de l\'inscription');
          }

          const data = await response.json();
          set({ isLoading: false });

          return data;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${get().token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Erreur lors de la déconnexion');
          }

          // Nettoyer le stockage local
          localStorage.removeItem('token');

          set({
            user: null,
            token: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export const useAuth = () => useAuthStore();

export default useAuth;

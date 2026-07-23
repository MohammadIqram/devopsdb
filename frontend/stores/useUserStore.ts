import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { axiosInstance as axios } from "@/lib/axios"
import { User, SignupCredentials, LoginCredentials, AuthResponse } from '@/types/auth';

interface UserState {
    user: User | null;
    token: string | null;
    loading: boolean;
    checkingAuth: boolean;

    // Actions
    signup: (credentials: SignupCredentials) => Promise<any>;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    addBillingAddress: (form: Record<string, any>) => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: false,
            checkingAuth: true,

            // --- SIGNUP ---
            signup: async ({ name, email, password, confirmPassword }) => {
                set({ loading: true });

                if (password !== confirmPassword) {
                    set({ loading: false });
                    toast.error('Passwords do not match');
                    return false;
                }

                try {
                    await axios.post<AuthResponse>('/auth/signup', { name, email, password });
                    toast.success('Account created successfully!');
                    set({ loading: false });
                    return {
                        success: true,
                        redirectUrl: '/login',
                    }
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(error.response?.data?.message || 'An error occurred during signup');
                    return false;
                }
            },

            // --- LOGIN ---
            login: async ({ email, password }) => {
                set({ loading: true });

                try {
                    const res = await axios.post<AuthResponse>('/auth/login', { email, password });
                    const { user, token } = res.data;

                    set({ user, token, loading: false });
                    toast.success('Logged in successfully!');
                    return true;
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(error.response?.data?.message || 'Invalid credentials');
                    return false;
                }
            },

            // --- LOGOUT ---
            logout: () => {
                set({ user: null, token: null });
                toast.success('Logged out');
            },

            // --- CHECK AUTH PROFILE ---
            checkAuth: async () => {
                const { token } = get();

                if (!token) {
                    set({ checkingAuth: false, user: null });
                    return;
                }

                set({ checkingAuth: true });
                try {
                    const response = await axios.get<{ user: User }>('/auth/profile');
                    set({ user: response.data.user, checkingAuth: false });
                } catch (error: any) {
                    console.error('Auth check failed:', error.message);
                    set({ checkingAuth: false, user: null, token: null });
                }
            },

            // --- UPDATE BILLING ADDRESS ---
            addBillingAddress: async (form) => {
                set({ loading: true });
                try {
                    await axios.post('/cart/billing-address', form);
                    set((state) => ({
                        user: state.user ? { ...state.user, address: form } : null,
                        loading: false,
                    }));
                    toast.success('Address updated successfully!');
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(
                        error?.response?.data?.message || 'Some unexpected error occurred. Try again later!'
                    );
                }
            },
        }),
        {
            name: 'user-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),
        }
    )
);
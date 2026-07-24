import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { axiosInstance as axios } from "@/lib/axios"
import { User, SignupCredentials, LoginCredentials, AuthResponse } from '@/types/auth';

interface UserState {
    user: User | null;
    loading: boolean;
    checkingAuth: boolean;

    // Actions
    setUser: (user: User | null) => void;
    signup: (credentials: SignupCredentials) => Promise<any>;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => void;
    addBillingAddress: (form: Record<string, any>) => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: false,
            checkingAuth: true,

            setUser: (user) => set({ user }),

            // --- SIGNUP ---
            signup: async ({ name, email, password }) => {
                set({ loading: true });
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
                    const { user } = res.data;

                    set({ user, loading: false });
                    toast.success('Logged in successfully!');
                    return true;
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(error.response?.data?.message || 'Invalid credentials');
                    return false;
                }
            },

            // --- LOGOUT ---
            logout: async () => {
                try {
                    const res = await axios.post('/auth/logout');
                    set({ user: null });
                } catch {
                    toast.error("Could not logout user. Try again.");
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
            }),
        }
    )
);
import axios from 'axios';
import { useUserStore } from "../stores/useUserStore";

// 1. Create Axios instance with sensible defaults
export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api',
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (
            error.response?.status === 401 &&
            error.response?.data?.code === 'auth:authorized:no_auths'
        ) {
            useUserStore.getState().setUser(null);
            if (typeof window !== "undefined") {
                window.location.href = '/';
            }
            return new Promise(() => { });
        }
        return Promise.reject(error);
    }
);

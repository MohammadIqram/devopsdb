export interface User {
    id: string;
    name: string;
    email: string;
    githubAccessToken?: string | null;
    address?: Record<string, any>;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: User;
}

export interface SignupCredentials {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';

export default function SignupPage() {
    const router = useRouter();
    const { signup, loading } = useUserStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // Consent State
    const [consents, setConsents] = useState({
        termsAndPrivacy: false,
        marketingEmails: false,
    });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);
        // 1. Client-side Password Match Check
        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        // 2. Client-side Consent Check
        if (!consents.termsAndPrivacy) {
            setErrorMsg('You must accept the Terms of Service and Privacy Policy to continue.');
            return;
        }

        // 3. Construct payload matching your userSchema consents object
        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            consents: {
                termsOfService: {
                    accepted: consents.termsAndPrivacy,
                    acceptedAt: new Date(),
                    version: 'v1.0',
                },
                privacyPolicy: {
                    accepted: consents.termsAndPrivacy,
                    acceptedAt: new Date(),
                    version: 'v1.0',
                },
                marketingEmails: {
                    accepted: consents.marketingEmails,
                    updatedAt: new Date(),
                },
            },
        };

        const result = await signup(payload);

        if (result?.success && result?.redirectUrl) {
            router.push(result.redirectUrl);
        } else if (result?.error) {
            setErrorMsg(result.error);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 flex flex-col justify-center my-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Get Started Free
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    Create your account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-sm border border-slate-200 dark:border-slate-800 sm:rounded-xl sm:px-10">

                    {errorMsg && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Jane Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="jane@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* --- CONSENT CHECKBOXES --- */}
                        <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">

                            {/* Mandatory Terms & Privacy */}
                            <div className="flex items-start gap-2.5">
                                <input
                                    id="termsAndPrivacy"
                                    type="checkbox"
                                    required
                                    checked={consents.termsAndPrivacy}
                                    onChange={(e) => setConsents({ ...consents, termsAndPrivacy: e.target.checked })}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <label htmlFor="termsAndPrivacy" className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                                    I agree to the{' '}
                                    <Link href="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                        Terms of Service
                                    </Link>{' '}
                                    and acknowledge the{' '}
                                    <Link href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                        Privacy Policy
                                    </Link>
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                            </div>

                            {/* Optional Marketing Consent */}
                            <div className="flex items-start gap-2.5">
                                <input
                                    id="marketingEmails"
                                    type="checkbox"
                                    checked={consents.marketingEmails}
                                    onChange={(e) => setConsents({ ...consents, marketingEmails: e.target.checked })}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <label htmlFor="marketingEmails" className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                    Send me product updates, releases, and deployment tips (Optional).
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !consents.termsAndPrivacy}
                            className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>

                        <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Your data is encrypted & stored securely
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
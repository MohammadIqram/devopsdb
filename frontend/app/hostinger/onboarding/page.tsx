'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Key, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function HostingerOnboarding() {
    const [agreed, setAgreed] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            setStatus({ type: 'error', msg: 'You must agree to the consent terms.' });
            return;
        }
        if (!apiToken.trim()) {
            setStatus({ type: 'error', msg: 'Please provide a valid Hostinger API token.' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            await axiosInstance.post('/auth/hostinger-connect', {
                token: apiToken.trim(),
            });
            setStatus({ type: 'success', msg: 'Hostinger connected successfully!' });
            setApiToken('');
            router.push('/hostinger');
        } catch (err: any) {
            setStatus({ type: 'error', msg: err?.response?.data?.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 flex flex-col justify-center my-12 px-4 sm:px-6 lg:px-8">
            {/* Header / Branding Zone */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Infrastructure Integration
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    Connect Hostinger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    To automate your deployments, grant access by pasting your Hostinger API Token below.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-sm border border-slate-200 dark:border-slate-800 sm:rounded-xl sm:px-10">

                    {/* Quick Guide Box */}
                    <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span className="flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-indigo-500" /> How to get your token
                            </span>
                            <a
                                href="https://hpanel.hostinger.com/dev-tools/api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                                Open hPanel <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-1 pl-1 leading-relaxed">
                            <li>Log in to your <strong>Hostinger hPanel</strong>.</li>
                            <li>Go to <strong>Dev Tools → API</strong>.</li>
                            <li>Click <strong>Generate Token</strong> and set permissions.</li>
                        </ol>
                    </div>

                    {/* Feedback Status Alert */}
                    {status && (
                        <div
                            className={`mb-4 p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${status.type === 'error'
                                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                }`}
                        >
                            {status.type === 'error' ? (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                            )}
                            <span>{status.msg}</span>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Token Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                API Token
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="Paste hostinger API token here..."
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Authorization Checkbox */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-2.5">
                                <input
                                    id="consent"
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                                />
                                <label htmlFor="consent" className="text-xs text-slate-600 dark:text-slate-400 leading-tight cursor-pointer">
                                    I authorize this application to manage Hostinger services on my behalf using this API token.
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!agreed || loading}
                            className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Connect Hostinger'
                            )}
                        </button>

                        <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Tokens are encrypted with AES-256 before storage
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
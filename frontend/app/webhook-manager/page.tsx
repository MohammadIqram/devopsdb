'use client';

import { useState } from 'react';
import { GitBranch, Link as LinkIcon, Lock, PlusCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import { useRepoStore } from '@/lib/store';

export default function WebhookManager() {
    const { repos, selectedRepo, setSelectedRepo } = useRepoStore();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [secret, setSecret] = useState('');

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!selectedRepo || !webhookUrl) return;

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const payload = {
                repo: selectedRepo,
                webhookUrl,
                secret,
            }
            const res = await axiosInstance.post("/webhooks/add", payload);
            const data = res.data;

            if (res.status === 200) {
                setStatus({ type: 'success', message: data.message });
                setWebhookUrl('');
                setSecret('');
            } else {
                setStatus({ type: 'error', message: data.message });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error. Could not connect to backend server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto m-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm font-sans">
            <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Repository Webhook</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Attach a new payload endpoint to listen for repository events automatically.
            </p>

            {/* Alert Status Banner */}
            {status.message && (
                <div
                    className={`p-4 mb-6 rounded-lg text-sm flex items-center gap-3 ${status.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                        }`}
                >
                    {status.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                    )}
                    <span>{status.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Repository Dropdown */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Select Repository
                    </label>
                    <div className="relative">
                        <GitBranch className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {repos.map((r: any) => (
                                <option key={r.id || r.name} value={r.name}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Webhook URL Input */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Payload Webhook URL <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="url"
                            required
                            placeholder="https://your-ngrok-url.ngrok-free.app/api/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Optional Webhook Secret */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Webhook Secret <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="password"
                            placeholder="••••••••••••"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !selectedRepo || !webhookUrl}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Adding Webhook...
                        </>
                    ) : (
                        'Add Webhook to Repository'
                    )}
                </button>
            </form>
        </div>
    );
}
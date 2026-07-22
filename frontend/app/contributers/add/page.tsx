'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus,
    Search,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    Shield,
    X,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import { useRepoStore } from '@/lib/store';

export interface SearchedUser {
    id: number;
    username: string;
    avatar: string;
    profileUrl: string;
}

export default function AddCollaboratorModal() {
    const selectedRepo = useRepoStore((state) => state.selectedRepo);

    // Search & input states
    const [query, setQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
    const [permission, setPermission] = useState<'pull' | 'push' | 'admin'>('push');

    // Loading & feedback states
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Debounced user search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setErrorMsg(null);

            try {
                const { data } = await axiosInstance.get<SearchedUser[]>(
                    '/repo/search-users',
                    { params: { q: query } }
                );
                setSearchResults(data);
            } catch (err: any) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle Form Submission
    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetUsername = selectedUser ? selectedUser.username : query.trim();

        if (!targetUsername) {
            setErrorMsg('Please select or enter a valid GitHub username');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data } = await axiosInstance.post('/repo/collaborators', {
                repo: selectedRepo,
                username: targetUsername,
                permission,
            });

            setSuccessMsg(data.message || `Invitation sent to ${targetUsername}`);
            setQuery('');
            setSelectedUser(null);
            setSearchResults([]);
        } catch (err: any) {
            console.error('Failed to add collaborator:', err);
            setErrorMsg(
                err.response?.data?.error ||
                err.response?.data?.details ||
                'Failed to send invitation'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <UserPlus className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Add Person to Repository
                    </h2>
                    <p className="text-xs text-slate-500">
                        Target Repo:{' '}
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                            {selectedRepo || 'No repository selected'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Success Notification */}
            {successMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                    <button onClick={() => setSuccessMsg(null)} className="p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error Notification */}
            {errorMsg && (
                <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg flex items-center justify-between text-sm text-rose-800 dark:text-rose-300">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                    <button onClick={() => setErrorMsg(null)} className="p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddCollaborator} className="space-y-4">
                {/* Search Field */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Search Person (Username, Full Name, or Email)
                    </label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={selectedUser ? selectedUser.username : query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (selectedUser) setSelectedUser(null);
                            }}
                            placeholder="e.g. alexrivera, alex@devops.io, Alex Rivera"
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {isSearching && (
                            <Loader2 className="w-4 h-4 absolute right-3 top-3 text-indigo-500 animate-spin" />
                        )}
                        {selectedUser && (
                            <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* User Search Dropdown Suggestions */}
                    {!selectedUser && searchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setSearchResults([]);
                                    }}
                                    className="flex items-center justify-between p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition border-b last:border-0 border-slate-100 dark:border-slate-800"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700"
                                        />
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {user.username}
                                        </span>
                                    </div>
                                    <a
                                        href={user.profileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-400 hover:text-indigo-500 p-1"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected User Badge */}
                {selectedUser && (
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg flex items-center gap-3">
                        <img
                            src={selectedUser.avatar}
                            alt={selectedUser.username}
                            className="w-8 h-8 rounded-full border border-indigo-300 dark:border-indigo-700"
                        />
                        <div>
                            <p className="text-xs text-slate-500">Selected GitHub User</p>
                            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                                {selectedUser.username}
                            </p>
                        </div>
                    </div>
                )}

                {/* Permission Selector */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> Repository Access Permission
                    </label>
                    <select
                        value={permission}
                        onChange={(e: any) => setPermission(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="push">Write / Push (Can push commits & pull requests)</option>
                        <option value="pull">Read / Pull (Can view & clone only)</option>
                        <option value="admin">Admin (Full administrative control)</option>
                    </select>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || (!selectedUser && !query.trim())}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending Invitation...
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" /> Send Repository Invitation
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
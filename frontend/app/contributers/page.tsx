'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Users,
    ExternalLink,
    RefreshCw,
    GitCommit,
    MoreVertical,
    UserX,
    Loader2,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import { useRepoStore } from '@/lib/store';

export interface Contributor {
    id: number;
    username: string;
    avatar: string;
    contributions: number;
    profileUrl: string;
    type: string;
}

export default function ContributorsList() {
    const selectedRepo = useRepoStore((state) => state.selectedRepo);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Track active 3-dot dropdown menu
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [removingUser, setRemovingUser] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Close 3-dot dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchContributors = async () => {
        if (!selectedRepo) return;

        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.get<Contributor[]>('/repo/contributors', {
                params: { repo: selectedRepo },
            });

            setContributors(data);
        } catch (err: any) {
            console.error('Failed to fetch contributors:', err);
            setError(
                err.response?.data?.error || 'Unable to load repository contributors'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContributors();
    }, [selectedRepo]);

    // Remove Contributor API Handler
    const handleRemoveUser = async (username: string) => {
        setActiveMenuId(null);

        const confirmed = window.confirm(
            `Are you sure you want to remove ${username} from ${selectedRepo}?`
        );
        if (!confirmed) return;

        setRemovingUser(username);

        try {
            await axiosInstance.delete('/repo/contributors', {
                data: {
                    repo: selectedRepo,
                    username,
                },
            });

            // Remove from local state on success
            setContributors((prev) => prev.filter((user) => user.username !== username));
        } catch (err: any) {
            console.error('Failed to remove contributor:', err);
            alert(err.response?.data?.error || `Failed to remove ${username}`);
        } finally {
            setRemovingUser(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        Contributors ({contributors.length})
                    </h3>
                </div>
                <button
                    onClick={fetchContributors}
                    disabled={loading}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Refresh contributors"
                >
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                    Loading contributors for {selectedRepo}...
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="p-3 text-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg">
                    {error}
                </div>
            )}

            {/* Contributors Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {contributors.map((user) => (
                        <div
                            key={user.id}
                            className="relative flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                            {/* Left Details */}
                            <div className="flex items-center gap-3">
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {user.username}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <GitCommit className="w-3 h-3 text-emerald-500" />
                                        {user.contributions} commits
                                    </p>
                                </div>
                            </div>

                            {/* Right Action Menu */}
                            <div className="flex items-center gap-1">
                                <a
                                    href={user.profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-indigo-500 p-1 rounded-md"
                                    title="View GitHub Profile"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>

                                {/* 3-Dot Menu Trigger */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setActiveMenuId(activeMenuId === user.id ? null : user.id)
                                        }
                                        disabled={removingUser === user.username}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                                    >
                                        {removingUser === user.username ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                        ) : (
                                            <MoreVertical className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenuId === user.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1 text-xs"
                                        >
                                            <button
                                                onClick={() => handleRemoveUser(user.username)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition font-medium text-left"
                                            >
                                                <UserX className="w-3.5 h-3.5" />
                                                Remove User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
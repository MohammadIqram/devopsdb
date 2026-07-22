'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    GitBranch,
    MoreVertical,
    Trash2,
    Folder,
    FileText,
    ChevronLeft,
    ChevronRight,
    Shield,
    Loader2,
    X,
    Eye,
    Search,
    AlertCircle,
    Download,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import { useRepoStore } from '@/lib/store';

export interface Branch {
    name: string;
    protected: boolean;
    sha: string;
}

export interface TreeItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
}

export default function BranchesPage() {
    const params = useParams();
    const routeRepo = params?.repo_name as string | undefined;
    const storeRepo = useRepoStore((state) => state.selectedRepo);
    const selectedRepo = routeRepo || storeRepo;

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Pagination
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const limit = 10;

    // Selection & Actions
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
    const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

    // Dropdown tracking
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Modal State
    const [viewBranch, setViewBranch] = useState<string | null>(null);
    const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
    const [loadingTree, setLoadingTree] = useState<boolean>(false);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBranches = async () => {
        if (!selectedRepo) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await axiosInstance.get('/repo/branches', {
                params: { repo: selectedRepo, page, limit },
            });
            setBranches(data.branches || []);
            setHasMore(Boolean(data.hasMore));
            setSelectedBranches([]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [selectedRepo, page]);

    const filteredBranches = useMemo(() => {
        if (!searchQuery.trim()) return branches;
        return branches.filter((b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [branches, searchQuery]);

    const handleViewContent = async (branchName: string) => {
        setViewBranch(branchName);
        setActiveMenu(null);
        setLoadingTree(true);

        try {
            const { data } = await axiosInstance.get('/repo/branch/tree', {
                params: { repo: selectedRepo, branch: branchName },
            });
            setTreeItems(data || []);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to load branch content');
            setViewBranch(null);
        } finally {
            setLoadingTree(false);
        }
    };

    // Download File Handler
    const handleDownloadFile = async (filePath: string, fileName: string) => {
        if (!selectedRepo || !viewBranch) return;

        setDownloadingPath(filePath);
        try {
            const response = await axiosInstance.get('/repo/file/download', {
                params: {
                    repo: selectedRepo,
                    branch: viewBranch,
                    path: filePath,
                },
                responseType: 'blob', // Important for file binaries
            });

            // Trigger browser download
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to download file');
        } finally {
            setDownloadingPath(null);
        }
    };

    const handleDeleteSingle = async (branchName: string) => {
        setActiveMenu(null);
        if (!confirm(`Are you sure you want to delete branch '${branchName}'?`)) return;

        try {
            await axiosInstance.delete('/repo/branch', {
                data: { repo: selectedRepo, branch: branchName },
            });
            setBranches((prev) => prev.filter((b) => b.name !== branchName));
            setSelectedBranches((prev) => prev.filter((name) => name !== branchName));
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to delete branch ${branchName}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBranches.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedBranches.length} selected branches?`)) return;

        setIsBulkDeleting(true);
        try {
            const { data } = await axiosInstance.post('/repo/branches/bulk-delete', {
                repo: selectedRepo,
                branches: selectedBranches,
            });

            alert(
                `Successfully deleted ${data.deleted?.length || 0} branch(es).` +
                (data.failed?.length ? ` Failed: ${data.failed.length}` : '')
            );
            fetchBranches();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to perform bulk deletion');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedBranches.length === filteredBranches.length) {
            setSelectedBranches([]);
        } else {
            setSelectedBranches(filteredBranches.map((b) => b.name));
        }
    };

    const toggleSelectBranch = (name: string) => {
        setSelectedBranches((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    if (!selectedRepo) {
        return (
            <div className="max-w-6xl mx-auto p-6 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium">No repository target specified.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Repository Branches
                        </h1>
                        <p className="text-xs text-slate-500">
                            Target Repository:{' '}
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                {selectedRepo}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter branches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    {selectedBranches.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50 shrink-0"
                        >
                            {isBulkDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            Delete ({selectedBranches.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        Loading branches...
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredBranches.length > 0 &&
                                                selectedBranches.length === filteredBranches.length
                                            }
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-4">Branch Name</th>
                                    <th className="p-4">Latest SHA</th>
                                    <th className="p-4">Protection</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                {filteredBranches.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            {searchQuery
                                                ? `No branches found matching "${searchQuery}".`
                                                : 'No branches found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBranches.map((branch) => (
                                        <tr
                                            key={branch.name}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition"
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBranches.includes(branch.name)}
                                                    onChange={() => toggleSelectBranch(branch.name)}
                                                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <GitBranch className="w-4 h-4 text-indigo-500 shrink-0" />
                                                <span>{branch.name}</span>
                                            </td>
                                            <td className="p-4 font-mono text-slate-500">
                                                {branch.sha ? branch.sha.substring(0, 7) : '—'}
                                            </td>
                                            <td className="p-4">
                                                {branch.protected ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                                        <Shield className="w-3 h-3" /> Protected
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">Unprotected</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right relative">
                                                <div className="inline-block text-left">
                                                    <button
                                                        onClick={() =>
                                                            setActiveMenu(
                                                                activeMenu === branch.name ? null : branch.name
                                                            )
                                                        }
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {activeMenu === branch.name && (
                                                        <div
                                                            ref={dropdownRef}
                                                            className="absolute right-4 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-30 py-1 text-left"
                                                        >
                                                            <button
                                                                onClick={() => handleViewContent(branch.name)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                                                View Files
                                                            </button>
                                                            {!branch.protected && (
                                                                <button
                                                                    onClick={() => handleDeleteSingle(branch.name)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition font-medium"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Delete Branch
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                    <span>Page {page}</span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={!hasMore || loading}
                            onClick={() => setPage((p) => p + 1)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-900 disabled:opacity-40 transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Branch File Tree & Download Modal */}
            {viewBranch && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-indigo-500" />
                                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                    Files in branch:{' '}
                                    <span className="font-mono text-indigo-400">{viewBranch}</span>
                                </h3>
                            </div>
                            <button
                                onClick={() => setViewBranch(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-2 flex-1">
                            {loadingTree ? (
                                <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    Loading file tree...
                                </div>
                            ) : treeItems.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">
                                    Directory is empty.
                                </p>
                            ) : (
                                treeItems.map((item) => (
                                    <div
                                        key={item.path}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-xs"
                                    >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            {item.type === 'dir' ? (
                                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                            )}
                                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                                {item.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {item.size > 0 && (
                                                <span className="text-slate-400 font-mono text-[11px]">
                                                    {(item.size / 1024).toFixed(1)} KB
                                                </span>
                                            )}

                                            {/* Download button for files */}
                                            {item.type === 'file' && (
                                                <button
                                                    onClick={() => handleDownloadFile(item.path, item.name)}
                                                    disabled={downloadingPath === item.path}
                                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded transition disabled:opacity-50"
                                                    title={`Download ${item.name}`}
                                                >
                                                    {downloadingPath === item.path ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
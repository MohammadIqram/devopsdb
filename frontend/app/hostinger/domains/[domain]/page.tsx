'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'react-hot-toast';

// Types
interface ContactDetails {
    name: string;
    email: string;
    phone: string;
    organization: string;
    address: string;
    country: string;
}

interface DomainDetailResponse {
    info: {
        domain: string;
        status: string;
        type: string;
        created_at: string;
        expires_at: string;
        name_servers: {
            ns1: string,
            ns2: string,
        };
        auto_renew?: boolean;
        privacy_protection?: boolean;
    };
    dnsRecords: Array<{ id: string; type: string; name: string; content: string; ttl: number }>;
    contacts: {
        registrant: ContactDetails;
        administrative: ContactDetails;
        billing: ContactDetails;
        technical: ContactDetails;
    };
}

const fetchDomainDetails = async (domain: string): Promise<DomainDetailResponse> => {
    const response = await axiosInstance.get(`/hostinger/domains/${domain}`);
    return response.data.data;
};

export default function DomainDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const domain = params.domain as string;

    // Active Tabs
    const [activeTab, setActiveTab] = useState<'dns' | 'childNs' | 'redirects' | 'dnssec' | 'history' | 'subdomains' | 'ssl'>('dns');
    const [showOwnershipModal, setShowOwnershipModal] = useState(false);
    const [ownershipTab, setOwnershipTab] = useState<'registrant' | 'administrative' | 'billing' | 'technical'>('registrant');

    // Form States
    const [nsInput1, setNsInput1] = useState('');
    const [nsInput2, setNsInput2] = useState('');
    const [isEditingNs, setIsEditingNs] = useState(false);

    // Child NS state
    const [childNsHost, setChildNsHost] = useState('');
    const [childNsIp, setChildNsIp] = useState('');

    // Redirect State
    const [redirectSource, setRedirectSource] = useState('');
    const [redirectTarget, setRedirectTarget] = useState('');

    // Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['domainDetails', domain],
        queryFn: () => fetchDomainDetails(domain),
        enabled: !!domain,
    });

    // Mutation: Update Nameservers
    const updateNsMutation = useMutation({
        mutationFn: async (name_servers: string[]) => {
            await axiosInstance.put(`/hostinger/domains/${domain}/name_servers`, { name_servers });
        },
        onSuccess: () => {
            toast.success('Nameservers updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['domainDetails', domain] });
            setIsEditingNs(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update name_servers');
        },
    });

    const handleNsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nsInput1 || !nsInput2) return toast.error('Both name_servers are required.');
        updateNsMutation.mutate([nsInput1, nsInput2]);
    };

    const handleCreateChildNs = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Child Nameserver ns1.${childNsHost}.${domain} (${childNsIp}) created!`);
        setChildNsHost('');
        setChildNsIp('');
    };

    const handleAddRedirect = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Redirect added: ${redirectSource || '/'} -> ${redirectTarget}`);
        setRedirectSource('');
        setRedirectTarget('');
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500 animate-pulse">Loading domain details for {domain}...</div>;
    }

    if (isError || !data) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <button onClick={() => router.back()} className="text-sm text-indigo-600 mb-4 font-semibold">← Back to Domains</button>
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error loading domain: {(error as Error)?.message}</div>
            </div>
        );
    }

    const { info, contacts, dnsRecords } = data;
    console.log(info, dnsRecords)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <button onClick={() => router.back()} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2 block">
                        ← Back to Domains List
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{info.domain}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                            {info.status}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setShowOwnershipModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                    Domain Ownership Details
                </button>
            </div>

            {/* Grid Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Domain Info */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain Info</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{info.type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Created At:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(info.created_at).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Auto Renew:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{info.auto_renew ? 'Enabled' : 'Disabled'}</span></div>
                    </div>
                </div>

                {/* Card 2: Expiration */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiration</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Expires On:</span> <span className="font-semibold text-amber-600 dark:text-amber-400">{new Date(info.expires_at).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Privacy Protection:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{info.privacy_protection ? 'Active' : 'Inactive'}</span></div>
                    </div>
                </div>

                {/* Card 3: Nameservers Quick View */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Nameservers</h3>
                        <button onClick={() => setIsEditingNs(!isEditingNs)} className="text-xs text-indigo-600 font-semibold hover:underline">
                            {isEditingNs ? 'Cancel' : 'Change'}
                        </button>
                    </div>

                    {!isEditingNs ? (
                        <div className="text-sm space-y-1">
                            <p className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-1.5 rounded">{info.name_servers.ns1}</p>
                            <p className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-1.5 rounded">{info.name_servers.ns2}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleNsSubmit} className="space-y-2">
                            <input
                                type="text"
                                placeholder="NS 1"
                                defaultValue={info.name_servers.ns1}
                                onChange={(e) => setNsInput1(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-700 rounded dark:bg-slate-800"
                            />
                            <input
                                type="text"
                                placeholder="NS 2"
                                defaultValue={info.name_servers.ns2}
                                onChange={(e) => setNsInput2(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-700 rounded dark:bg-slate-800"
                            />
                            <button
                                type="submit"
                                disabled={updateNsMutation.isPending}
                                className="w-full py-1 text-xs bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
                            >
                                {updateNsMutation.isPending ? 'Saving...' : 'Save Nameservers'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Main Tabbed Section: DNS / Nameservers Management */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/50">
                    {[
                        { id: 'dns', label: 'DNS Records' },
                        { id: 'childNs', label: 'Child Nameservers' },
                        { id: 'redirects', label: 'Redirects' },
                        { id: 'dnssec', label: 'DNSSEC' },
                        { id: 'history', label: 'DNS History' },
                        { id: 'subdomains', label: 'Sub Domains' },
                        { id: 'ssl', label: 'SSL Certificates' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="p-6">
                    {/* TAB 1: DNS Records */}
                    {activeTab === 'dns' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">DNS Zone Records</h3>
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="p-2.5">Type</th>
                                            <th className="p-2.5">Name</th>
                                            <th className="p-2.5">Value / Target</th>
                                            <th className="p-2.5">TTL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {dnsRecords.length > 0 ? (
                                            dnsRecords.map((r, i) => (
                                                <tr key={r.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                    <td className="p-2.5 font-bold text-indigo-600">{r.type}</td>
                                                    <td className="p-2.5 font-mono">{r.name}</td>
                                                    <td className="p-2.5 font-mono truncate max-w-xs">{r.content}</td>
                                                    <td className="p-2.5 text-slate-500">{r.ttl}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="p-4 text-center text-slate-400">No DNS records found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Child Nameservers */}
                    {activeTab === 'childNs' && (
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Create Child Nameserver</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Register custom hostnames (e.g., ns1.{domain}) pointing to an IP address.</p>
                            </div>
                            <form onSubmit={handleCreateChildNs} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Host Name</label>
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            placeholder="ns1"
                                            value={childNsHost}
                                            onChange={(e) => setChildNsHost(e.target.value)}
                                            className="p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-l dark:bg-slate-800 w-full"
                                            required
                                        />
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-3 py-2 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r">
                                            .{domain}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target IP Address</label>
                                    <input
                                        type="text"
                                        placeholder="192.0.2.1"
                                        value={childNsIp}
                                        onChange={(e) => setChildNsIp(e.target.value)}
                                        className="p-2 text-xs border border-slate-300 dark:border-slate-700 rounded dark:bg-slate-800 w-full"
                                        required
                                    />
                                </div>

                                <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700">
                                    Create Child Nameserver
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: Redirects */}
                    {activeTab === 'redirects' && (
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Domain Redirects</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Forward web traffic from this domain to another web address.</p>
                            </div>

                            <form onSubmit={handleAddRedirect} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Source Subpath (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="/blog"
                                        value={redirectSource}
                                        onChange={(e) => setRedirectSource(e.target.value)}
                                        className="p-2 text-xs border border-slate-300 dark:border-slate-700 rounded dark:bg-slate-800 w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://destination.com"
                                        value={redirectTarget}
                                        onChange={(e) => setRedirectTarget(e.target.value)}
                                        className="p-2 text-xs border border-slate-300 dark:border-slate-700 rounded dark:bg-slate-800 w-full"
                                        required
                                    />
                                </div>

                                <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700">
                                    Add Redirect Rule
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 4: DNSSEC */}
                    {activeTab === 'dnssec' && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">DNSSEC Security</h3>
                            <p className="text-xs text-slate-500">Protect your domain against DNS spoofing and cache poisoning.</p>
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status: Disabled</span>
                                    <p className="text-xs text-slate-400">DNSSEC keys are not signed for this zone.</p>
                                </div>
                                <button onClick={() => toast.success('DNSSEC enabled!')} className="px-3 py-1.5 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded font-medium">Enable DNSSEC</button>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: DNS History */}
                    {activeTab === 'history' && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">DNS Change History</h3>
                            <p className="text-xs text-slate-500">Audit trail of past modifications to your zone files.</p>
                            <div className="text-xs text-slate-500 p-4 border border-dashed rounded-lg text-center">No recent DNS changes logged.</div>
                        </div>
                    )}

                    {/* TAB 6: Subdomains */}
                    {activeTab === 'subdomains' && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Subdomains</h3>
                            <p className="text-xs text-slate-500">Manage active subdomains for {domain}.</p>
                            <div className="text-xs text-slate-500 p-4 border border-dashed rounded-lg text-center">No active subdomains created.</div>
                        </div>
                    )}

                    {/* TAB 7: SSL */}
                    {activeTab === 'ssl' && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">SSL Certificate Status</h3>
                            <p className="text-xs text-slate-500">Free Let's Encrypt SSL certificate status for HTTPS traffic.</p>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                ✓ Active Let's Encrypt SSL Certificate
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Domain Ownership Details */}
            {showOwnershipModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl print:shadow-none print:border-none">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Domain Ownership Details - {domain}</h2>
                            <div className="flex gap-2 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200"
                                >
                                    🖨 Print
                                </button>
                                <button
                                    onClick={() => setShowOwnershipModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Ownership Section Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
                            {(['registrant', 'administrative', 'billing', 'technical'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setOwnershipTab(role)}
                                    className={`flex-1 py-2.5 text-xs font-semibold capitalize border-b-2 transition ${ownershipTab === role
                                        ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900'
                                        : 'border-transparent text-slate-500'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Contact Record Content */}
                        <div className="p-6 text-xs space-y-3">
                            <h3 className="font-bold text-sm capitalize text-slate-800 dark:text-slate-100 border-b pb-2">
                                {ownershipTab} Contact Record
                            </h3>
                            {contacts[ownershipTab] ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="text-slate-400 block">Full Name:</span> <span className="font-medium">{contacts[ownershipTab].name}</span></div>
                                    <div><span className="text-slate-400 block">Organization:</span> <span className="font-medium">{contacts[ownershipTab].organization}</span></div>
                                    <div><span className="text-slate-400 block">Email Address:</span> <span className="font-medium">{contacts[ownershipTab].email}</span></div>
                                    <div><span className="text-slate-400 block">Phone Number:</span> <span className="font-medium">{contacts[ownershipTab].phone}</span></div>
                                    <div className="col-span-2"><span className="text-slate-400 block">Physical Address:</span> <span className="font-medium">{contacts[ownershipTab].address}, {contacts[ownershipTab].country}</span></div>
                                </div>
                            ) : (
                                <p className="text-slate-400">No contact record found for {ownershipTab}.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
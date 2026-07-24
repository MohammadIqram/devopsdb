'use client';

import React, { useState } from 'react';

export default function HostingerOnboarding() {
    const [agreed, setAgreed] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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
            // Send token to your server for validation & encrypted storage
            const res = await fetch('/api/hostinger/save-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: apiToken.trim() }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to save token.');

            setStatus({ type: 'success', msg: 'Hostinger connected successfully!' });
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h2>Connect Hostinger Account</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
                To automate your infrastructure, grant access by pasting your Hostinger API Token below.
            </p>

            {/* Quick link guide */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <strong>How to get your API token:</strong>
                <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
                    <li>Log in to your <strong>Hostinger hPanel</strong>.</li>
                    <li>Go to <strong>Dev Tools → API</strong>.</li>
                    <li>Click <strong>Generate Token</strong>, set permissions, and copy it.</li>
                </ol>
                <a
                    href="https://hpanel.hostinger.com/dev-tools/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6366f1', textDecoration: 'underline' }}
                >
                    Open Hostinger API Settings ↗
                </a>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Token Input */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>API Token</label>
                    <input
                        type="password"
                        placeholder="Paste hostinger API token here..."
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                </div>

                {/* Consent Checkbox */}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <input
                        type="checkbox"
                        id="consent"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        style={{ marginTop: '3px' }}
                    />
                    <label htmlFor="consent" style={{ fontSize: '13px', color: '#334155' }}>
                        I authorize this application to manage Hostinger services on my behalf using this API token.
                    </label>
                </div>

                {/* Status Message */}
                {status && (
                    <div style={{ color: status.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '14px', marginBottom: '12px' }}>
                        {status.msg}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!agreed || loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: agreed ? '#6366f1' : '#94a3b8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: agreed ? 'pointer' : 'not-allowed'
                    }}
                >
                    {loading ? 'Verifying...' : 'Connect Hostinger'}
                </button>
            </form>
        </div>
    );
}
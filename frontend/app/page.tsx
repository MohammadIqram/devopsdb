'use client';

import { useState, useEffect } from 'react';
import { Play, AlertOctagon, CheckCircle2, Clock, Terminal, RefreshCw } from 'lucide-react';

const BACKEND_URL = 'http://localhost:4000';

export default function DevOpsDashboard() {
  const [deployments, setDeployments] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deployRes, bugRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/deployments`),
        fetch(`${BACKEND_URL}/api/bugs`),
      ]);

      setDeployments(await deployRes.json());
      setBugs(await bugRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket for Live Webhook Updates
  useEffect(() => {
    fetchData();

    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'GITHUB_EVENT') {
        fetchData(); // Trigger instant refresh on GitHub status change
      }
    };

    return () => ws.close();
  }, []);

  // Trigger Deployment Action
  const triggerDeploy = async (env: any) => {
    setDeploying(true);
    try {
      await fetch(`${BACKEND_URL}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env, user: 'DevOps Lead' }),
      });
      alert(`Deployment triggered for ${env}!`);
      setTimeout(fetchData, 2000);
    } catch (err) {
      alert('Failed to trigger deploy');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DevOps & Control Dashboard</h1>
          <p className="text-sm text-slate-400">Live deployment pipelines, raw logs, and critical issue tracker</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded-md transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Actions & Deployments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Action Trigger Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">Trigger Deployment</h2>
            <div className="flex gap-4">
              <button
                disabled={deploying}
                onClick={() => triggerDeploy('staging')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Deploy to Staging
              </button>
              <button
                disabled={deploying}
                onClick={() => triggerDeploy('production')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Deploy to Production
              </button>
            </div>
          </div>

          {/* Deployment History / Pipeline */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">Recent Pipelines</h2>
            <div className="space-y-3">
              {deployments.map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {run.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                    ) : run.conclusion === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-rose-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{run.name}</p>
                      <p className="text-xs text-slate-400">
                        {run.branch} • <span className="italic">{run.commit}</span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Critical Bugs */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" /> Critical Bugs ({bugs.length})
              </h2>
            </div>

            {bugs.length === 0 ? (
              <p className="text-sm text-slate-500">No open critical bugs found.</p>
            ) : (
              <div className="space-y-3">
                {bugs.map((bug: any) => (
                  <div key={bug.id} className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg">
                    <a
                      href={bug.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-rose-200 hover:underline block"
                    >
                      #{bug.number}: {bug.title}
                    </a>
                    <span className="text-xs text-rose-400/70 mt-1 block">Opened by {bug.author}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
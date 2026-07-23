'use client';

import { ChangeEvent, useState } from 'react';
import { ShieldCheck, GitBranch, Moon, Sun, Home, Link as LinkIcon, Users, FolderGit2, Loader2, LogIn, ChevronDown, UserIcon, Settings, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useRepoStore, useUIStore } from '@/lib/store';
import { useUserStore } from '@/stores/useUserStore';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { repos, selectedRepo, setSelectedRepo, loading } = useRepoStore();
  const { theme, toggleTheme } = useUIStore();
  const { user, logout, checkingAuth } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Webhooks', path: '/webhook-manager', icon: LinkIcon },
    { label: 'Contributors', path: '/contributers', icon: Users },
    { label: 'Add Contributors', path: '/contributers/add', icon: Users },
    { label: 'Repositories', path: '/repo', icon: FolderGit2 },
  ];

  return (
    <header className={`border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Title and Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">DevOps Control Console</h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-repository deployments & monitoring
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Navigation Links */}
          <nav className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${isActive
                    ? (theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-indigo-600 shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950')
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Repo Selector */}
          <div className="relative flex items-center min-w-[200px]">
            <GitBranch className="absolute left-3 w-3.5 h-3.5 text-indigo-500 pointer-events-none z-10" />
            <select
              value={selectedRepo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
              disabled={loading}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 appearance-none"
            >
              {loading && <option>Loading...</option>}
              {!loading && repos.length === 0 && <option>No repositories</option>}
              {repos.map((r) => (
                <option key={r.id} value={r.name} className="bg-white dark:bg-slate-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition cursor-pointer ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
          <div>
            <NavbarAuth user={user} logout={logout} checkingAuth={checkingAuth} isOpen={isOpen} setIsOpen={setIsOpen} />
          </div>
        </div>

      </div>
    </header>
  );
}

function NavbarAuth({ user, logout, checkingAuth, isOpen, setIsOpen }: any) {

  // Extract email prefix (everything before '@')
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : emailPrefix.charAt(0).toUpperCase() || 'U';

  // 1. Loading state while Zustand checks localStorage auth status
  if (checkingAuth) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-1.5 px-3">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 2. LOGGED OUT STATE
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors duration-150"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </Link>
    );
  }

  // 3. LOGGED IN STATE (Avatar + Dropdown on Hover/Click)
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger: Avatar with Email Prefix */}
      <button
        onClick={() => setIsOpen((prev: boolean) => !prev)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-expanded={isOpen}
      >
        {/* Avatar Circle */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {initial}
        </div>

        {/* Email Prefix */}
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
          {emailPrefix}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Hover/Click Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full pt-1.5 w-60 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden py-1">

            {/* Header: Full Name + Full Email */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.name || 'User'}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
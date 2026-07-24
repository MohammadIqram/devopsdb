'use client';

import { useUIStore } from '@/lib/store';
import Header from './Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);
  return (
    <div className={theme === 'dark' ? 'dark bg-slate-950 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-800 min-h-screen'}>
      <Header />
      <main className="max-w-7xl mx-auto p-6 lg:p-10 font-sans transition-colors duration-200">
        {children}
      </main>
    </div>
  );
}

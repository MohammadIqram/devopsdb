'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is considered fresh for 5 minutes — no refetch on mount during this window
                        staleTime: 5 * 60 * 1000,
                        // Keep unused cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Don't retry on failure by default
                        retry: 1,
                        // Don't refetch when the window regains focus
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    // Safe initialization using optional chaining
    const [isHydrated, setIsHydrated] = useState(() => {
        return !!useUserStore.persist?.hasHydrated?.();
    });

    useEffect(() => {
        // If it's already hydrated, or persist isn't available, stop here
        if (!useUserStore.persist || useUserStore.persist.hasHydrated()) {
            setIsHydrated(true);
            return;
        }

        const unsub = useUserStore.persist.onFinishHydration(() => {
            setIsHydrated(true);
        });

        return () => unsub?.();
    }, []);

    if (!isHydrated) return null;

    return (
        <>
            {children}
        </>
    );
}
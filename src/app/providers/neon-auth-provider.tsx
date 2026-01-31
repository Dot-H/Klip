'use client';

import { useState, useEffect } from 'react';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '~/lib/auth/client';

interface NeonAuthProviderProps {
  children: React.ReactNode;
}

export function NeonAuthProvider({ children }: NeonAuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render children directly during SSR to avoid hydration mismatch
  // NeonAuthUIProvider will wrap them after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      emailOTP
      social={{ providers: ['google'] }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

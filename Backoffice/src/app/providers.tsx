import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { EditionLanguageProvider } from '@/services/edition/EditionLanguageProvider';

/** Providers globaux : données serveur, toasts, session, langue d'édition. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <EditionLanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </EditionLanguageProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

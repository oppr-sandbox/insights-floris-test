'use client';

import { NotificationProvider } from '@/providers/NotificationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({
  children
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false
      }
    }
  }));

  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NotificationProvider>
  );
}

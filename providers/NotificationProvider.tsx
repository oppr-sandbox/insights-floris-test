'use client';

import React, { createContext, useContext } from 'react';

// SignalR has been replaced by Convex's built-in reactivity: any component that
// reads data via useQuery updates automatically when the backend changes, so the
// previous subscribe/unsubscribe hub plumbing is no longer needed. This provider
// keeps the same interface as a no-op for backwards compatibility with callers.
type MessageHandler = (topic: string, message: unknown) => void;

type NotificationContextType = {
  subscribe: (topic: string, onMessage: MessageHandler) => void;
  unsubscribe: (topic: string) => void;
  connectionState: 'Connected' | 'Disconnected' | 'Connecting';
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const value: NotificationContextType = {
    subscribe: () => undefined,
    unsubscribe: () => undefined,
    connectionState: 'Connected',
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
};

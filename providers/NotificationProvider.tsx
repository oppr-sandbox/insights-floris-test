'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

type MessageHandler = (topic: string, message: any) => void;

type NotificationContextType = {
  subscribe: (topic: string, onMessage: MessageHandler) => void;
  unsubscribe: (topic: string) => void;
  connectionState: 'Connected' | 'Disconnected' | 'Connecting';
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [connectionState, setConnectionState] = useState<'Connected' | 'Disconnected' | 'Connecting'>('Disconnected');
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_NOTIFICATION_URL + '/hub/notifications')
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setConnectionState('Connecting');

    connection.start()
      .then(() => {
        setConnectionState('Connected');
        console.log('SignalR connected');
      })
      .catch(err => {
        setConnectionState('Disconnected');
        console.error('SignalR connection error:', err);
      });

    connection.on('receiveMessage', (topic: string, message: string) => {
      const handler = handlersRef.current.get(topic);
      if (handler) {
        handler(topic, message);
      }
    });

    return () => {
      connection.stop();
    };
  }, []);

  const subscribe = async (topic: string, onMessage: MessageHandler) => {
    handlersRef.current.set(topic, onMessage);
    await connectionRef.current?.invoke('subscribeToTopic', topic);
  };

  const unsubscribe = async (topic: string) => {
    handlersRef.current.delete(topic);
    await connectionRef.current?.invoke('unsubscribeFromTopic', topic);
  };

  return (
    <NotificationContext.Provider value={{ subscribe, unsubscribe, connectionState }}>
      {children}
    </NotificationContext.Provider>
  )
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useSignalR must be used inside SignalRProvider');
  return ctx;
};

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveWsBase(): string {
  try {
    const anyConstants: any = Constants as any;
    const hostUri: string | undefined = anyConstants?.expoGoConfig?.hostUri || anyConstants?.manifest?.debuggerHost || anyConstants?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      const scheme = Platform.OS === 'web' ? 'ws' : 'ws';
      return `${scheme}://${host}:8000`;
    }
  } catch {}
  return 'ws://localhost:8000';
}

export function useChatSocket(conversationId: number | undefined, token: string | null, onEvent: (payload: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !token) return;
    const base = resolveWsBase();
    const url = `${base}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [conversationId, token, onEvent]);

  const sendTyping = () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: 'typing' }));
    } catch {}
  };

  return { sendTyping };
}



"use client";

import { useState, useEffect, useRef } from "react";
import type { IndexQuote } from "@/lib/types";

interface IndexConfig {
  key: string;
  label: string;
  url: string;
}

interface UseIndexWsOptions {
  indices: IndexConfig[];
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

interface UseIndexWsReturn {
  quotes: Record<string, IndexQuote>;
  connected: boolean;
}

export function useIndexWs(
  options: UseIndexWsOptions
): UseIndexWsReturn {
  const {
    indices,
    reconnectDelay = 2000,
    maxReconnectDelay = 30000,
  } = options;

  const [quotes, setQuotes] = useState<Record<string, IndexQuote>>({});
  const [connected, setConnected] = useState(false);

  const wsRefs = useRef<Map<string, WebSocket>>(new Map());
  const reconnectTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(true);

  function updateConnectedState() {
    let anyOpen = false;
    wsRefs.current.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) anyOpen = true;
    });
    setConnected(anyOpen);
  }

  useEffect(() => {
    mountedRef.current = true;

    function connectOne(idx: IndexConfig) {
      const existing = wsRefs.current.get(idx.key);
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      let ws: WebSocket;
      try {
        ws = new WebSocket(idx.url);
      } catch {
        scheduleReconnect(idx);
        return;
      }

      ws.onopen = () => {
        attemptsRef.current.set(idx.key, 0);
        updateConnectedState();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as IndexQuote;
          if (data.currentPrice != null) {
            setQuotes((prev) => ({ ...prev, [idx.key]: data }));
          }
        } catch {
          // non-JSON message
        }
      };

      ws.onclose = () => {
        wsRefs.current.delete(idx.key);
        updateConnectedState();
        if (mountedRef.current) scheduleReconnect(idx);
      };

      ws.onerror = () => {
        // onclose fires after this
      };

      wsRefs.current.set(idx.key, ws);
    }

    function scheduleReconnect(idx: IndexConfig) {
      const attempt = (attemptsRef.current.get(idx.key) ?? 0) + 1;
      attemptsRef.current.set(idx.key, attempt);
      const delay = Math.min(
        reconnectDelay * Math.pow(1.5, attempt - 1),
        maxReconnectDelay
      );

      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        reconnectTimers.current.delete(idx.key);
        connectOne(idx);
      }, delay);

      reconnectTimers.current.set(idx.key, timer);
    }

    indices.forEach((idx) => connectOne(idx));

    return () => {
      mountedRef.current = false;
      wsRefs.current.forEach((ws) => {
        ws.onclose = null;
        ws.close();
      });
      wsRefs.current.clear();
      reconnectTimers.current.forEach((timer) => clearTimeout(timer));
      reconnectTimers.current.clear();
      attemptsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indices, reconnectDelay, maxReconnectDelay]);

  return { quotes, connected };
}

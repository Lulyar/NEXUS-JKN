import { useEffect, useRef, useState } from "react";

import { API_BASE } from "../services/api";

export default function useRealtime({ enabled = true, onMessage } = {}) {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";

    const wsHost = API_BASE.replace(/^https?:\/\//, "");

    const socket = new WebSocket(`${wsProtocol}://${wsHost}/ws/live-stream`);

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        onMessage?.(data);
      } catch (error) {
        console.error("Realtime message error:", error);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, onMessage]);

  return {
    connected,
  };
}

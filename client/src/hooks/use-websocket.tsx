import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./use-auth";

export interface DeadlineNotification {
  id: number;
  projectId: number;
  projectTitle: string;
  title: string;
  deadline: Date;
  type: 'project' | 'task';
  status: string;
}

interface WebSocketContextType {
  connected: boolean;
  deadlineNotifications: DeadlineNotification[];
  sendMessage: (data: any) => void;
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [deadlineNotifications, setDeadlineNotifications] = useState<DeadlineNotification[]>([]);

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (!user) return;

    // Установка WebSocket соединения
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket соединение установлено");
      setConnected(true);

      // Аутентификация через WebSocket
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        console.log("WebSocket: Получено сырое сообщение:", event.data);
        const data = JSON.parse(event.data);
        console.log("WebSocket: Распарсенные данные:", {
          type: data.type,
          messageData: data.data,
          timestamp: new Date().toISOString()
        });

        // Обработка разных типов сообщений
        if (data.type === 'new_message') {
            try {
              const messageData = data.data;
              if (messageData && messageData.message) {
                console.log('Получено новое сообщение:', {
                  id: messageData.message.id,
                  from: messageData.from?.username,
                  to: messageData.message.recipientId,
                  content: messageData.message.content
                });

                // Создаем и отправляем событие для чата
                const event = {
                  type: 'new_message',
                  data: messageData
                };
                window.dispatchEvent(new CustomEvent('chat-message', { detail: event }));

                // Обновляем счетчик непрочитанных сообщений
                window.dispatchEvent(new Event('unread-messages-update'));
              }
            } catch (error) {
              console.error("Ошибка при обработке нового сообщения:", error);
            }
          } else if (data.type === 'connection') {
            console.log(data.message);
          } else if (data.type === 'deadlines') {
            const notifications = data.deadlines.map((item: any) => ({
              ...item,
              deadline: new Date(item.deadline)
            }));
            setDeadlineNotifications(notifications);
          }
      } catch (error) {
        console.error("Ошибка при обработке сообщения WebSocket:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Ошибка WebSocket:", error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket соединение закрыто");
      setConnected(false);
    };

    setSocket(ws);

    // Функция очистки при размонтировании
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Функция для отправки сообщений через WebSocket
  const sendMessage = (data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.error("WebSocket не подключен. Пытаемся переподключиться...");
      // Пытаемся переподключиться
      if (socket) {
        socket.close();
        initializeWebSocket();
      }
    }
  };

  const initializeWebSocket = () => {
    const newSocket = new WebSocket(process.env.WEBSOCKET_URL || 'ws://localhost:3000/ws');
    newSocket.onopen = () => {
      setSocket(newSocket);
      setConnected(true);
      console.log('WebSocket подключен');
    };
    newSocket.onclose = () => {
      setConnected(false);
      // Пытаемся переподключиться через 3 секунды
      setTimeout(initializeWebSocket, 3000);
    };
    return newSocket;
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        deadlineNotifications,
        sendMessage,
        socket
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket должен использоваться внутри WebSocketProvider");
  }
  return context;
}
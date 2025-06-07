import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";

// Типы для работы с чатом
export type ChatRecipient = {
  id: number;
  username: string;
  fullName?: string;
  avatar?: string;
  role?: string;
}

export type ChatResponse = {
  success: boolean;
  messages: ChatMessage[];
  recipient: ChatRecipient;
}

export type UploadableFile = File | null;

// Хук для работы с чатом по определенному проекту с определенным пользователем
export function useProjectChat(projectId: number | null, recipientId: number | null) {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [file, setFile] = useState<UploadableFile>(null);

  // Запрос сообщений чата
  const {
    data: chatData,
    isLoading: chatLoading,
    error: chatError,
    refetch: refetchChat
  } = useQuery<ChatResponse>({
    queryKey: !projectId || projectId === 0 
      ? ["/api/chat/direct", recipientId] 
      : ["/api/projects", projectId, "chat", recipientId],
    queryFn: async ({ queryKey }) => {
      try {
        const url = queryKey.join('/');
        const res = await fetch(url, { credentials: "include" });

        if (!res.ok) {
          throw new Error('Ошибка при загрузке чата');
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Ошибка при загрузке чата');
        }

        return {
          success: true,
          messages: data.messages || [],
          recipient: data.recipient
        };
      } catch (error) {
        console.error("Ошибка при загрузке чата:", error);
        throw error;
      }
    },
    enabled: !!user && !!recipientId,
    retry: false
  });

  // Запрос непрочитанных сообщений
  const {
    data: unreadData,
    refetch: refetchUnread
  } = useQuery<{ success: boolean; count: number }>({
    queryKey: ["/api/chat/unread"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      try {
        console.log('Начало отправки сообщения:', { content, hasFile: !!file });
        const formData = new FormData();
        formData.append("content", content);

        if (file) {
          formData.append("attachment", file);
          console.log('Прикреплен файл:', file.name, file.type, file.size);
        }

        const url = (!projectId || projectId === 0)
          ? `/api/chat/direct/${recipientId}` 
          : `/api/projects/${projectId}/chat/${recipientId}`;

        console.log('Отправка запроса на URL:', url);

        const res = await fetch(url, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          }
        });

        console.log('Получен ответ:', {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        });

        if (!res.ok) {
          const errorData = await res.json().catch(e => ({ message: 'Не удалось прочитать ответ сервера' }));
          console.error('Ошибка от сервера:', errorData);
          throw new Error(errorData.message || `Ошибка при отправке сообщения: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('Успешный ответ:', data);
        return data;
      } catch (error) {
        console.error("Детальная ошибка при отправке сообщения:", {
          error,
          projectId,
          recipientId,
          messageLength: content?.length
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Обновляем кэш в зависимости от типа чата (прямой или по проекту)
      if (!projectId || projectId === 0) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/chat/direct", recipientId] 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", projectId, "chat", recipientId] 
        });
      }

      // Сбрасываем файл после успешной отправки
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка отправки сообщения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Мутация для пометки сообщения как прочитанного
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PATCH", `/api/chat/messages/${messageId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      refetchUnread();
    },
    onError: (error: Error) => {
      console.error("Ошибка при обновлении статуса сообщения:", error);
    },
  });

  // Обработка входящих сообщений через WebSocket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (event: any) => {
      try {
        console.log("=== НАЧАЛО ОБРАБОТКИ СООБЩЕНИЯ ===");
        console.log("Текущий пользователь:", { 
          id: user?.id, 
          role: user.role, 
          username: user.username 
        });
        console.log("Текущий projectId:", projectId);
        console.log("Текущий recipientId:", recipientId);

        console.log("=== ДЕТАЛЬНЫЙ ЛОГ СОБЫТИЯ ЧАТА ===");
          console.log("1. Исходное событие:", event);
          console.log("2. Детали пользователя:", { 
            currentUserId: user?.id,
            currentUserRole: user?.role,
            currentProjectId: projectId,
            currentRecipientId: recipientId
          });
          const data = event.detail || event;
          console.log("3. Данные события после обработки:", data);
          if (data?.type === "new_message" && data?.data?.message) {
            console.log("4. Детали сообщения:", {
              messageId: data.data.message.id,
              fromUserId: data.data.message.userId,
              toUserId: data.data.message.recipientId,
              projectId: data.data.message.projectId,
              content: data.data.message.content,
              timestamp: data.data.message.createdAt
            });
          }

        if (data?.type === "new_message" && data?.data) {
          const message = data.data.message;
          const fromUser = data.data.from;

          console.log("Обработка нового сообщения:", {
            messageId: message.id,
            fromUserId: message.userId,
            fromUsername: fromUser?.username,
            toUserId: message.recipientId,
            content: message.content,
            projectId: message.projectId,
            currentProjectId: projectId,
            currentUserId: user?.id,
            currentRecipientId: recipientId
          });

          // Для прямого чата (projectId === null или 0)
          // Определяем тип текущего чата и входящего сообщения
          const isCurrentChatDirect = !projectId || projectId === 0;
          const isIncomingMessageDirect = !message.projectId;

          console.log("Проверка типов чатов:", {
            currentChat: isCurrentChatDirect ? "прямой" : "проект",
            incomingMessage: isIncomingMessageDirect ? "прямой" : "проект",
            currentProjectId: projectId,
            messageProjectId: message.projectId
          });

          let isRelevantMessage = false;

          // Проверка релевантности сообщения
          if (isCurrentChatDirect) {
            // Для прямого чата (projectId === null или 0)
            isRelevantMessage = !message.projectId && 
              ((message.userId === recipientId && message.recipientId === user?.id) ||
               (message.userId === user?.id && message.recipientId === recipientId));
          } else {
            // Для чата проекта
            isRelevantMessage = message.projectId === projectId && 
              ((message.userId === recipientId && message.recipientId === user?.id) ||
               (message.userId === user?.id && message.recipientId === recipientId));
          }

          console.log("Проверка сообщения:", {
            isCurrentChatDirect,
            messageProjectId: message.projectId,
            currentProjectId: projectId,
            messageUserId: message.userId,
            messageRecipientId: message.recipientId,
            currentUserId: user?.id,
            isRelevantMessage
          });

          console.log("Результат проверки:", {
            isRelevantMessage,
            messageDetails: {
              messageId: message.id,
              from: message.userId,
              to: message.recipientId,
              projectId: message.projectId,
              content: message.content
            }
          });

            try {
              console.log("Проверка чата проекта:", {
                projectMatch,
                participantCheck,
                messageDetails: {
                  messageProjectId: message.projectId,
                  currentProjectId: projectId,
                  messageUserId: message.userId,
                  messageRecipientId: message.recipientId
                }
              });

              if (isCurrentChatDirect === isIncomingMessageDirect) {
                if (isCurrentChatDirect) {
                  isRelevantMessage = (message.userId === recipientId && message.recipientId === user?.id) ||
                                    (message.userId === user?.id && message.recipientId === recipientId);
                } else {
                  isRelevantMessage = message.projectId === projectId &&
                                    (message.userId === recipientId || message.recipientId === recipientId);
                }
              }
            } catch (error) {
              console.error("Ошибка при обработке сообщения:", error);
            }

          console.log("Итоговая проверка релевантности:", {
            isRelevantMessage,
            messageDetails: {
              messageId: message.id,
              userId: message.userId,
              recipientId: message.recipientId,
              currentUserId: user?.id,
              currentRecipientId: recipientId,
              projectId: message.projectId,
              content: message.content
            }
          });

          console.log("Проверка релевантности сообщения:", {
            isRelevantMessage,
            conditions: {
              directChat: {
                condition1: message.userId === recipientId && message.recipientId === user?.id,
                condition2: message.userId === user?.id && message.recipientId === recipientId
              },
              projectChat: {
                userMatch: (message.userId === recipientId && message.recipientId === user?.id) || 
                          (message.userId === user?.id && message.recipientId === recipientId),
                projectMatch: message.projectId === projectId
              }
            }
          });

          if (isRelevantMessage) {
            console.log("=== СООБЩЕНИЕ РЕЛЕВАНТНО ===");
            console.log("Детали релевантного сообщения:", {
              id: message.id,
              content: message.content,
              from: message.userId,
              to: message.recipientId,
              projectId: message.projectId,
              timestamp: message.createdAt
            });

            // Обновляем данные чата
            refetchChat();

            // Показываем уведомление только для входящих сообщений
            if (message.recipientId === user?.id) {
              toast({
                title: "Новое сообщение",
                description: `От ${fromUser.fullName || fromUser.username}`,
              });

              // Обновляем счетчик непрочитанных сообщений
              refetchUnread();
            }
          }
        }
      } catch (e) {
        console.error("Ошибка обработки WebSocket сообщения:", e);
      }
    };

    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleNewMessage(data);
      } catch (e) {
        console.error("Ошибка обработки WebSocket сообщения:", e);
      }
    };

    // Слушаем пользовательское событие вместо raw websocket
    const chatMessageHandler = (event: CustomEvent) => {
      try {
        handleNewMessage(event.detail);
      } catch (e) {
        console.error("Ошибка обработки сообщения чата:", e);
      }
    };

    window.addEventListener('chat-message', chatMessageHandler as EventListener);

    return () => {
      window.removeEventListener('chat-message', chatMessageHandler as EventListener);
    };
  }, [socket, user, projectId, recipientId, refetchChat, refetchUnread, toast]);

  // Автоматически помечаем новые сообщения как прочитанные
  useEffect(() => {
    if (!chatData?.messages || !user) return;

    // Используем debounce для предотвращения частых вызовов
    const timeoutId = setTimeout(() => {
      // Находим непрочитанные сообщения, адресованные текущему пользователю
      const unreadMessages = chatData.messages.filter(
        msg => !msg.isRead && msg.recipientId === user.id
      );

      // Помечаем их как прочитанные одним запросом
      if (unreadMessages.length > 0) {
        const lastMessage = unreadMessages[unreadMessages.length - 1];
        markAsReadMutation.mutate(lastMessage.id);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chatData?.messages, user, markAsReadMutation]);

  // Функция для отправки сообщения
  const sendMessage = async (content: string) => {
    if (!content.trim() && !file) return;

    try {
      console.log('Начало отправки сообщения:', { 
        content, 
        hasFile: !!file,
        projectId,
        recipientId 
      });

      const result = await sendMessageMutation.mutateAsync({ 
        content: content.trim(), 
        file: file || undefined 
      });

      console.log('Сообщение успешно отправлено:', result);

      // Очищаем файл после успешной отправки
      if (file) {
        setFile(null);
      }

    } catch (error: any) {
        const errorDetails = {
          name: error.name,
          message: error.message || String(error),
          stack: error.stack,
          cause: error.cause,
          projectId,
          recipientId,
          hasFile: !!file,
          fileInfo: file ? {
            name: file.name,
            type: file.type,
            size: file.size
          } : null,
          contentLength: content?.length,
          url: (!projectId || projectId === 0)
            ? `/api/chat/direct/${recipientId}` 
            : `/api/projects/${projectId}/chat/${recipientId}`,
          timestamp: new Date().toISOString()
        };

        console.error('Детальная ошибка при отправке:', errorDetails);
        console.trace('Стек вызовов на момент ошибки:');

      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить сообщение. Попробуйте еще раз.",
        variant: "destructive",
      });

      // Повторно запрашиваем данные чата
      refetchChat();
    }
  };

  // Функция для выбора файла
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  return {
    messages: chatData?.messages || [],
    recipient: chatData?.recipient,
    isLoading: chatLoading,
    error: chatError,
    unreadCount: unreadData?.count || 0,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    selectedFile: file,
    selectFile: handleFileChange,
    clearFile: () => setFile(null),
    markAsRead: markAsReadMutation.mutate,
  };
}
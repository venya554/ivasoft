import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProjectChat, type UploadableFile } from "@/hooks/use-chat";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Send,
  Paperclip,
  File,
  FileText,
  X,
  Image,
  FileArchive,
  Download,
  Loader2
} from "lucide-react";

interface ChatInterfaceProps {
  projectId: number;
  recipientId: number;
  className?: string;
}

export default function ChatInterface({ 
  projectId, 
  recipientId,
  className = ""
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    recipient,
    isLoading,
    sendMessage,
    isSending,
    selectedFile,
    selectFile,
    clearFile
  } = useProjectChat(projectId, recipientId);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Получение иконки в зависимости от типа файла
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-5 w-5" />;
    } else if (type.startsWith("text/")) {
      return <FileText className="h-5 w-5" />;
    } else if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("7z")) {
      return <FileArchive className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  // Форматирование размера файла
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} байт`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} КБ`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
    }
  };

  // Обработка изменения файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectFile(e.target.files[0]);
    }
  };

  // Обработка отправки сообщения
  const handleSendMessage = () => {
    if (message.trim() || selectedFile) {
      sendMessage(message);
      setMessage("");
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>Получатель не найден</p>
      </div>
    );
  }

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={recipient.avatar} />
              <AvatarFallback>{recipient.fullName?.[0] || recipient.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{recipient.fullName || recipient.username}</CardTitle>
              <CardDescription className="text-xs">
                {recipient.role === "admin" ? (
                  <Badge variant="outline" className="text-xs py-0 h-5">Администратор</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs py-0 h-5">Клиент</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto mb-1 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Нет сообщений. Начните переписку прямо сейчас.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.userId === user?.id || msg.recipientId === recipientId;

              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="mb-1">{msg.content}</div>

                    {/* Отображение прикрепленного файла, если есть */}
                    {msg.attachmentPath && (
                      <div 
                        className={`mt-2 p-2 rounded flex items-center gap-2 ${
                          isOwnMessage 
                            ? 'bg-primary-foreground/10 text-primary-foreground' 
                            : 'bg-background text-foreground'
                        }`}
                      >
                        {getFileIcon(msg.attachmentType || "")}
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-medium truncate">
                            {msg.attachmentName}
                          </div>
                          {msg.attachmentSize && (
                            <div className="text-xs opacity-70">
                              {formatFileSize(msg.attachmentSize)}
                            </div>
                          )}
                        </div>
                        <a 
                          href={`/uploads/chat/${msg.attachmentPath.split('/').pop()}`} 
                          download={msg.attachmentName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1 rounded-full ${
                            isOwnMessage 
                              ? 'hover:bg-primary-foreground/20' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    )}

                    <div 
                      className={`text-xs mt-1 ${
                        isOwnMessage 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(msg.createdAt), 'HH:mm dd MMM', { locale: ru })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Панель выбранного файла */}
      {selectedFile && (
        <div className="mx-4 mb-2 p-2 bg-muted rounded-md flex items-center gap-2">
          {getFileIcon(selectedFile.type)}
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium truncate">{selectedFile.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => clearFile()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Поле ввода сообщения */}
      <div className="p-4 pt-2 border-t">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="min-h-[60px] resize-none"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </Button>
            <Button
              type="button"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={handleSendMessage}
              disabled={isSending || (!message.trim() && !selectedFile)}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ChatInterface from "./ChatInterface";
import type { User, Project } from "@shared/schema";

interface AdminChatProps {
  clients: User[];
  projects: Project[];
}

export default function AdminChat({ clients }: AdminChatProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<User | null>(null);

  // Фильтрация клиентов по поисковому запросу
  const filteredClients = clients.filter(client => {
    const searchTermLower = searchTerm.toLowerCase();
    return client.username.toLowerCase().includes(searchTermLower) ||
           client.fullName?.toLowerCase().includes(searchTermLower) ||
           client.email?.toLowerCase().includes(searchTermLower);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px] animate-in fade-in-50 duration-500">
      {/* Список клиентов */}
      <Card className="md:col-span-1 flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Клиенты</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск клиентов..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 pb-4 space-y-2">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${
                      selectedClient?.id === client.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>
                        {client.fullName?.[0] || client.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {client.fullName || client.username}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {client.email}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Клиент
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Клиенты не найдены
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Область чата */}
      <Card className="md:col-span-2 flex flex-col h-full">
        <CardContent className="p-0 h-full">
          {selectedClient ? (
            <ChatInterface
              projectId={0} // Всегда используем projectId=0 для прямого чата
              recipientId={selectedClient.id}
              className="h-full"
            />
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Выберите клиента для начала диалога
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
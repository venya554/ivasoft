import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  Users, 
  Briefcase, 
  MessagesSquare, 
  UserPlus, 
  PlusCircle, 
  Search, 
  ChevronRight, 
  Calendar,
  FileText,
  BarChart4,
  MessageCircle
} from "lucide-react";
import { ProjectFilters, type ProjectFilter } from "@/components/ProjectFilters";
import { DeadlineNotifications } from "@/components/DeadlineNotifications";
import { ProjectCalendar } from "@/components/ProjectCalendar";
import { ProjectAnalytics } from "@/components/ProjectAnalytics";
import AdminChat from "@/components/AdminChat";
import { User, Project, ContactMessage } from "@shared/schema";

// Интерфейсы для данных с сервера
interface UsersResponse {
  success: boolean;
  users: User[];
}

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  tasks?: Record<number, any[]>;
  comments?: Record<number, any[]>;
}

interface MessagesResponse {
  success: boolean;
  messages: ContactMessage[];
}

// Гарантирует возвращение React Element
export default function AdminPage({ params }: { params?: any }): React.JSX.Element {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Проверка прав доступа (только для администраторов)
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для доступа к панели администратора",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, navigate, toast]);

  // Запрос всех пользователей
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });

  // Запрос всех проектов
  const { data: projectsData, isLoading: projectsLoading } = useQuery<ProjectsResponse>({
    queryKey: ["/api/admin/projects"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });

  // Запрос всех сообщений контактной формы
  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessagesResponse>({
    queryKey: ["/api/admin/messages"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });

  // Обработка изменения статуса проекта
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({
        title: "Статус обновлен",
        description: "Статус проекта успешно обновлен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления статуса",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обработка создания нового пользователя
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Пользователь создан",
        description: "Новый пользователь успешно создан",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка создания пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обработка отметки сообщения как прочитанного
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/messages/${messageId}`, { isRead: true });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({
        title: "Статус сообщения обновлен",
        description: "Сообщение помечено как прочитанное",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления статуса сообщения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Фильтрация проектов
  const filteredProjects = projectsData?.success && projectsData.projects
    ? projectsData.projects.filter((project) => {
        // Поиск по названию или описанию
        const matchesSearch = !searchQuery || 
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          project.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Фильтры
        const matchesStatus = !projectFilter.status || project.status === projectFilter.status;
        const matchesDateFrom = !projectFilter.dateFrom || 
          new Date(project.createdAt) >= projectFilter.dateFrom;
        const matchesDateTo = !projectFilter.dateTo || 
          new Date(project.createdAt) <= projectFilter.dateTo;
          
        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
      })
    : [];

  // Сортировка проектов  
  const sortedProjects = filteredProjects ? [...filteredProjects].sort((a, b) => {
    const sortBy = projectFilter.sortBy || 'createdAt';
    const sortDirection = projectFilter.sortDirection || 'desc';
    
    if (sortBy === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    if (sortBy === 'deadline') {
      // Если дедлайн не указан, он идет в конец списка
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return sortDirection === 'asc' ? 1 : -1;
      if (!b.deadline) return sortDirection === 'asc' ? -1 : 1;
      
      return sortDirection === 'asc'
        ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    }
    
    if (sortBy === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    
    return 0;
  }) : [];

  // Обработчики фильтрации проектов
  const handleFilterChange = (filters: ProjectFilter) => {
    setProjectFilter(filters);
  };

  const handleResetFilters = () => {
    setProjectFilter({});
    setSearchQuery("");
  };

  // Если пользователь загружается или не администратор, показываем загрузку
  if (usersLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка панели администратора...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не администратор, показываем пустой div вместо null
  if (user.role !== "admin") {
    return <div></div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Панель администратора</h1>
        <div className="flex items-center gap-2">
          <DeadlineNotifications />
          <span className="text-sm text-muted-foreground">|</span>
          <span className="font-medium">{user.fullName || user.username}</span>
          <Badge>{user.role === "admin" ? "Администратор" : "Пользователь"}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart4 className="h-4 w-4" />
            <span>Обзор</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            <span>Проекты</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1">
            <MessagesSquare className="h-4 w-4" />
            <span>Сообщения</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Календарь</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Отчеты</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>Чат</span>
          </TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("users")}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Пользователи</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {usersData?.success ? usersData.users.length : 0}
                </div>
                <p className="text-muted-foreground">
                  Зарегистрированных клиентов
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("projects")}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>Проекты</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {projectsData?.success ? projectsData.projects.length : 0}
                </div>
                <p className="text-muted-foreground">
                  Активных проектов
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("messages")}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5 text-primary" />
                    <span>Сообщения</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {messagesData?.success && messagesData.messages ? messagesData.messages.filter((m: ContactMessage) => !m.isRead).length : 0}
                </div>
                <p className="text-muted-foreground">
                  Непрочитанных сообщений
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <ProjectAnalytics />
          </div>
        </TabsContent>

        {/* Пользователи */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Пользователи системы</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4" />
                      <span>Добавить пользователя</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить нового пользователя</DialogTitle>
                      <DialogDescription>
                        Заполните информацию о новом пользователе системы
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="username">Имя пользователя</label>
                          <Input id="username" placeholder="username" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="email">Email</label>
                          <Input id="email" type="email" placeholder="email@example.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="fullName">Полное имя</label>
                        <Input id="fullName" placeholder="Иван Иванов" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="password">Пароль</label>
                          <Input id="password" type="password" placeholder="••••••" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="role">Роль</label>
                          <Select defaultValue="client">
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Клиент</SelectItem>
                              <SelectItem value="admin">Администратор</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="company">Компания</label>
                          <Input id="company" placeholder="ООО «Компания»" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="phone">Телефон</label>
                          <Input id="phone" placeholder="+7 (999) 123-45-67" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => console.log("Создание пользователя")}>
                        Создать пользователя
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Управление пользователями системы
              </CardDescription>
              <div className="pt-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск пользователей..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Компания</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.success && usersData.users.filter((user: any) => 
                    !searchQuery || 
                    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.fullName || user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? "Администратор" : "Клиент"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.company || "—"}</TableCell>
                      <TableCell>{format(new Date(user.createdAt), "dd.MM.yyyy", { locale: ru })}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => console.log(`Редактировать пользователя ${user.id}`)}>
                          Редактировать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Проекты */}
        <TabsContent value="projects">
          <ProjectFilters 
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            filter={projectFilter}
            showStatus={true}
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Проекты</CardTitle>
              <CardDescription>
                Управление всеми проектами в системе
              </CardDescription>
              <div className="pt-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск проектов..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Дедлайн</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects?.map((project: any) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {project.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.user?.fullName || project.user?.username || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={project.status}
                          onValueChange={(value) => 
                            updateProjectStatusMutation.mutate({ projectId: project.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="новый">Новый</SelectItem>
                            <SelectItem value="в работе">В работе</SelectItem>
                            <SelectItem value="завершен">Завершен</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{format(new Date(project.createdAt), "dd.MM.yyyy", { locale: ru })}</TableCell>
                      <TableCell>
                        {project.deadline 
                          ? format(new Date(project.deadline), "dd.MM.yyyy", { locale: ru })
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Используем location.href для прямого перехода
                            window.location.href = `/dashboard/${project.id}`;
                          }}
                        >
                          Просмотр
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Сообщения */}
        <TabsContent value="messages">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Сообщения с сайта</CardTitle>
              <CardDescription>
                Сообщения, отправленные через контактную форму
              </CardDescription>
              <div className="pt-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск сообщений..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Отправитель</TableHead>
                    <TableHead>Тема</TableHead>
                    <TableHead>Сообщение</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messagesData?.success && messagesData.messages.filter((message: any) => 
                    !searchQuery || 
                    message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    message.message.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((message: any) => (
                    <TableRow key={message.id} className={message.isRead ? "" : "bg-primary/5"}>
                      <TableCell>
                        <div className="font-medium">{message.name}</div>
                        <div className="text-sm text-muted-foreground">{message.email}</div>
                      </TableCell>
                      <TableCell>{message.subject}</TableCell>
                      <TableCell>
                        <div className="truncate max-w-[300px]">
                          {message.message}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(message.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}</TableCell>
                      <TableCell>
                        <Badge variant={message.isRead ? "outline" : "default"}>
                          {message.isRead ? "Прочитано" : "Новое"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Просмотр
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{message.subject}</DialogTitle>
                              <DialogDescription>
                                От: {message.name} ({message.email})
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="whitespace-pre-wrap border p-4 rounded-md bg-muted/50">
                                {message.message}
                              </div>
                              <div className="mt-4 text-sm text-muted-foreground text-right">
                                {format(new Date(message.createdAt), "dd MMMM yyyy, HH:mm", { locale: ru })}
                              </div>
                            </div>
                            <DialogFooter>
                              {!message.isRead && (
                                <Button 
                                  variant="outline"
                                  onClick={() => markMessageAsReadMutation.mutate(message.id)}
                                >
                                  Отметить как прочитанное
                                </Button>
                              )}
                              <Button>
                                Ответить по email
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Календарь */}
        <TabsContent value="calendar">
          <ProjectCalendar />
        </TabsContent>

        {/* Отчеты */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Аналитика и отчеты</CardTitle>
              <CardDescription>
                Статистика и анализ данных проектов и задач
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Чат */}
        <TabsContent value="chat">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Чат с клиентами</CardTitle>
              <CardDescription>
                Общение с клиентами по их проектам
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersData?.success && projectsData?.success ? (
                <AdminChat 
                  clients={usersData.users.filter(user => user.role !== "admin")} 
                  projects={projectsData.projects} 
                />
              ) : (
                <div className="flex items-center justify-center h-[500px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Загрузка данных...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
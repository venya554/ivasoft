import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import ProjectDetail from "@/components/ProjectDetail";
import ChatInterface from "@/components/ChatInterface";
import { insertProjectSchema } from "@shared/schema";
import { 
  LogOut, 
  User, 
  UserCircle,
  Settings, 
  FileText, 
  List, 
  MessageSquare, 
  HelpCircle,
  PlusCircle,
  AlertCircle,
  Loader2,
  FolderOpen
} from "lucide-react";

// Схема формы создания проекта
const createProjectSchema = insertProjectSchema.pick({
  title: true,
  description: true,
  status: true,
}).extend({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  status: z.string().default("новый"),
});

type CreateProjectValues = z.infer<typeof createProjectSchema>;

// Гарантирует возвращение React Element
// Компонент для отображения сообщений
function MessageSection() {
  const { user } = useAuth();
  const [selectedAdmin, setSelectedAdmin] = useState<number | null>(null);
  
  // Получаем список администраторов
  const { data: adminData, isLoading: isLoadingAdmins } = useQuery<{ success: boolean, admins: any[] }>({
    queryKey: ["/api/admins"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Если есть прямое сообщение, показываем интерфейс чата
  if (selectedAdmin) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedAdmin(null)}
            className="mr-2"
          >
            ← Назад к списку
          </Button>
          <h3 className="text-lg font-medium">Прямое общение с администратором</h3>
        </div>
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <ChatInterface 
              projectId={0} // projectId=0 означает прямое общение
              recipientId={selectedAdmin} 
              className="h-full" 
            />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6">
      <h3 className="text-lg font-medium">Сообщения</h3>
      
      {isLoadingAdmins ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : adminData?.admins && adminData.admins.length > 0 ? (
        <>
          <h4 className="text-md font-medium text-muted-foreground">Администраторы</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adminData.admins.map((admin) => (
              <Card key={admin.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedAdmin(admin.id)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={admin.avatar || ""} />
                    <AvatarFallback className={
                      admin.id % 5 === 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" :
                      admin.id % 5 === 1 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                      admin.id % 5 === 2 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                      admin.id % 5 === 3 ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" :
                                          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                    }>
                      {admin.fullName?.[0] || admin.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {admin.fullName || admin.username}
                      <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded-sm inline-flex items-center">
                        <Settings className="h-3 w-3 mr-1" />
                        Админ
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Связаться напрямую</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Нет активных администраторов</h3>
            <p className="text-center text-muted-foreground mb-4">
              В настоящее время нет доступных администраторов для прямого общения.
              Попробуйте позже или воспользуйтесь чатом в проекте.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage({ params }: { params?: any }): React.JSX.Element {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Пытаемся извлечь ID проекта из URL, если мы на странице /dashboard/{id}
  const projectIdFromUrl = location.startsWith('/dashboard/') ? 
    parseInt(location.replace('/dashboard/', '')) : null;
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projectIdFromUrl);
  
  // При изменении URL обновляем selectedProjectId
  useEffect(() => {
    if (location.startsWith('/dashboard/')) {
      const id = parseInt(location.replace('/dashboard/', ''));
      setSelectedProjectId(id);
    }
  }, [location]);
  
  // API запросы
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
  const createProjectMutation = useCreateProject();

  // Форма создания проекта
  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'новый',
    }
  });

  // Получаем инициалы пользователя для аватара
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Обработчик создания проекта
  const onCreateProject = (values: CreateProjectValues) => {
    createProjectMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        form.reset();
      }
    });
  };

  // Обработчик выбора проекта для просмотра деталей
  const onSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Личный кабинет</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user?.avatar || ""} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {user?.role === "admin" && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded-sm mt-1 inline-block">
                    Администратор
                  </span>
                )}
              </div>
            </div>
            {user?.role === "admin" && (
              <Button 
                onClick={() => navigate("/admin")} 
                variant="default" 
                className="hidden sm:flex items-center gap-1"
                title="Перейти в панель администратора"
              >
                <Settings className="h-4 w-4" />
                <span>Админ-панель</span>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleLogout} title="Выйти">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Основной контент */}
      <main className="flex-1 p-6">
        <div className="grid gap-6">
          {/* Приветствие и информация */}
          <Card className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
            <div>
              <h2 className="text-3xl font-bold">Здравствуйте, {user?.fullName || user?.username}!</h2>
              <p className="text-muted-foreground mt-1">Добро пожаловать в ваш личный кабинет.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Создать новый проект
              </Button>
            </div>
          </Card>
          
          {/* Основные разделы */}
          <Tabs 
            defaultValue={selectedProjectId ? "project-details" : "projects"}
            value={selectedProjectId ? "project-details" : undefined}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="projects" className="flex items-center">
                <List className="mr-2 h-4 w-4" />
                Проекты
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Файлы
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Сообщения
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Профиль
              </TabsTrigger>
              {user?.role === "admin" && (
                <TabsTrigger value="admin" className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/admin")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Админ-панель
                </TabsTrigger>
              )}
              {selectedProjectId && (
                <TabsTrigger value="project-details" className="hidden">
                  Детали проекта
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Содержимое вкладки "Проекты" */}
            <TabsContent value="projects">
              <div className="grid gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Ваши проекты</h3>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Создать проект
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Создать новый проект</DialogTitle>
                        <DialogDescription>
                          Заполните информацию о новом проекте.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onCreateProject)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Название проекта</FormLabel>
                                <FormControl>
                                  <Input placeholder="Введите название проекта" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Описание проекта</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Опишите, что нужно сделать в рамках проекта" 
                                    className="min-h-[100px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={createProjectMutation.isPending}
                            >
                              {createProjectMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Создание...
                                </>
                              ) : "Создать проект"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isLoadingProjects ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projectsData?.projects && projectsData.projects.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projectsData.projects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xl truncate" title={project.title}>
                            {project.title}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(project.createdAt), 'dd MMMM yyyy', { locale: ru })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === "новый" 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-700/20 dark:text-blue-300" 
                                : project.status === "в работе" 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700/20 dark:text-yellow-300" 
                                : "bg-green-100 text-green-800 dark:bg-green-700/20 dark:text-green-300"
                            }`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {project.description}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => onSelectProject(project.id)}
                          >
                            Открыть проект
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    <Card className="flex flex-col items-center justify-center p-6 border-dashed">
                      <PlusCircle className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Создать новый проект</p>
                      <Button className="mt-4" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                        Создать
                      </Button>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">У вас пока нет проектов</h3>
                      <p className="text-center text-muted-foreground mb-4">
                        Создайте свой первый проект, чтобы начать работу с нашей системой управления проектами.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        Создать первый проект
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            {/* Содержимое вкладки "Детали проекта" */}
            {selectedProjectId && (
              <TabsContent value="project-details">
                <ProjectDetail 
                  projectId={selectedProjectId} 
                  onBack={() => setSelectedProjectId(null)} 
                />
              </TabsContent>
            )}
            
            {/* Содержимое вкладки "Файлы" */}
            <TabsContent value="files">
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Файловый менеджер</h3>
                  <p className="mt-2 text-muted-foreground">
                    Здесь будут храниться все файлы, связанные с вашими проектами
                  </p>
                  <Button className="mt-4">Загрузить файл</Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Содержимое вкладки "Сообщения" */}
            <TabsContent value="messages">
              <MessageSection />
            </TabsContent>
            
            {/* Содержимое вкладки "Профиль" */}
            <TabsContent value="profile">
              <div className="grid gap-6">
                <h3 className="text-lg font-medium">Ваш профиль</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-6">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user?.avatar || ""} />
                          <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-xl font-medium">{user?.fullName || user?.username}</h4>
                          <p className="text-muted-foreground">{user?.email}</p>
                          {user?.company && <p className="text-sm">{user.company}</p>}
                        </div>
                        <div className="md:ml-auto">
                          <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Редактировать профиль
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h5 className="font-medium mb-2">Контактная информация</h5>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="w-24 text-muted-foreground">Email:</span>
                              <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-muted-foreground">Телефон:</span>
                              <span>{user?.phone || "Не указан"}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-muted-foreground">Компания:</span>
                              <span>{user?.company || "Не указана"}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Учетные данные</h5>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="w-24 text-muted-foreground">Логин:</span>
                              <span>{user?.username}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-muted-foreground">Пароль:</span>
                              <span>••••••••</span>
                              <Button variant="link" size="sm" className="ml-2 h-auto p-0">
                                Изменить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Подвал */}
      <footer className="border-t py-4 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} IvASoft. Все права защищены.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <HelpCircle className="mr-2 h-4 w-4" />
              Поддержка
            </Button>
            <Button variant="ghost" size="sm">
              <AlertCircle className="mr-2 h-4 w-4" />
              Сообщить о проблеме
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
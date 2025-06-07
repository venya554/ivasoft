import React, { useState } from 'react';
import { useProject, useCreateTask, useAddComment, useUploadFile, useUpdateTask } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowLeft,
  Loader2, 
  FileUp, 
  Plus, 
  MessageSquare, 
  ClipboardList, 
  File,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileBadge,
  FileQuestion,
  AlertTriangle,
  FileWarning,
  FileX,
  ExternalLink,
  FileImage,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileSliders,
  MessageCircle,
  type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/ChatInterface';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Схема формы создания задачи
const createTaskSchema = z.object({
  title: z.string()
    .min(3, "Название задачи должно содержать минимум 3 символа")
    .max(100, "Название задачи не должно превышать 100 символов")
    .refine(value => !/^\s*$/.test(value), "Название не может состоять только из пробелов"),
  description: z.string()
    .min(10, "Описание должно содержать минимум 10 символов")
    .max(2000, "Описание не должно превышать 2000 символов")
    .refine(value => !/^\s*$/.test(value), "Описание не может состоять только из пробелов"),
  priority: z.enum(["низкий", "средний", "высокий"], {
    required_error: "Выберите приоритет задачи",
    invalid_type_error: "Недопустимое значение приоритета"
  }),
  status: z.enum(["новая", "в работе", "на проверке", "завершена"], {
    required_error: "Выберите статус задачи", 
    invalid_type_error: "Недопустимое значение статуса"
  }).default("новая"),
  deadline: z.string().optional().nullable(),
});

// Схема формы добавления комментария
const addCommentSchema = z.object({
  content: z.string()
    .min(1, "Комментарий не может быть пустым")
    .max(1000, "Комментарий не должен превышать 1000 символов")
    .refine(value => !/^\s*$/.test(value), "Комментарий не может состоять только из пробелов"),
});

// Схема формы загрузки файла
const fileUploadSchema = z.object({
  description: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val)
    .refine(
      val => !val || val.length <= 300, 
      "Описание не должно превышать 300 символов"
    ),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;
type AddCommentValues = z.infer<typeof addCommentSchema>;
type FileUploadValues = z.infer<typeof fileUploadSchema>;

// Константы для валидации файлов
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 10; // 10 bytes (валидация пустых файлов)
const ALLOWED_FILE_TYPES = [
  // Изображения
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Документы
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Таблицы
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Презентации
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Текст и архивы
  'text/plain', 'text/csv', 'text/html', 'text/markdown', 
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // JSON и XML
  'application/json', 'application/xml'
];

// Функция для получения иконки файла по типу
const getFileIcon = (fileType: string) => {
  if (!fileType) return File;

  if (fileType.startsWith('image/')) return FileImage;
  if (fileType === 'application/pdf') return FileText; // PDF использует иконку документа
  if (fileType.startsWith('text/')) return FileText;
  if (fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return FileSpreadsheet;
  }
  if (fileType === 'application/vnd.ms-powerpoint' || 
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return FileSliders;
  }
  if (fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return FileText;
  }
  if (fileType === 'application/zip' || 
      fileType === 'application/x-rar-compressed' || 
      fileType === 'application/x-7z-compressed') {
    return FileArchive;
  }

  return File;
};

// Функция для получения человекочитаемого названия типа файла
const getFileTypeLabel = (fileType: string) => {
  if (!fileType) return 'Файл';

  if (fileType.startsWith('image/')) return 'Изображение';
  if (fileType === 'application/pdf') return 'PDF документ';
  if (fileType.startsWith('text/')) return 'Текстовый файл';
  if (fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'Excel таблица';
  }
  if (fileType === 'application/vnd.ms-powerpoint' || 
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return 'PowerPoint презентация';
  }
  if (fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'Word документ';
  }
  if (fileType === 'application/zip') return 'Архив ZIP';
  if (fileType === 'application/x-rar-compressed') return 'Архив RAR';
  if (fileType === 'application/x-7z-compressed') return 'Архив 7Z';

  return 'Файл';
};

// Статусы задач в человекочитаемом формате
const taskStatusLabels: Record<string, { label: string, color: string }> = {
  'новая': { label: 'Новая', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700/20 dark:text-blue-300' },
  'в работе': { label: 'В работе', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/20 dark:text-yellow-300' },
  'на проверке': { label: 'На проверке', color: 'bg-purple-100 text-purple-800 dark:bg-purple-700/20 dark:text-purple-300' },
  'завершена': { label: 'Завершена', color: 'bg-green-100 text-green-800 dark:bg-green-700/20 dark:text-green-300' }
};

// Приоритеты задач в человекочитаемом формате
const priorityLabels: Record<string, { label: string, color: string }> = {
  'низкий': { label: 'Низкий', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700/20 dark:text-gray-300' },
  'средний': { label: 'Средний', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/20 dark:text-yellow-300' },
  'высокий': { label: 'Высокий', color: 'bg-red-100 text-red-800 dark:bg-red-700/20 dark:text-red-300' }
};

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: projectData, isLoading } = useProject(projectId);
  const createTaskMutation = useCreateTask(projectId);
  const addCommentMutation = useAddComment(projectId);
  const uploadFileMutation = useUploadFile(projectId);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [updateTaskId, setUpdateTaskId] = useState<number | null>(null);

  // Состояние для диалога добавления файла
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Формы
  const taskForm = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'средний',
      status: 'новая',
      deadline: ''
    }
  });

  const commentForm = useForm<AddCommentValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      content: ''
    }
  });

  const fileForm = useForm<FileUploadValues>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      description: ''
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Загрузка проекта...</p>
      </div>
    );
  }

  if (!projectData || !projectData.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold mb-2">Проект не найден</h3>
        <p className="text-muted-foreground mb-4">Не удалось загрузить данные проекта</p>
        <Button onClick={onBack}>Вернуться к списку проектов</Button>
      </div>
    );
  }

  // Данные проекта
  const project = projectData.project;
  const tasks = projectData.tasks || [];
  const comments = projectData.comments || [];
  const files = projectData.files || [];

  // Обработчики форм
  const onCreateTask = (values: CreateTaskValues) => {
    console.log("=== Отправка формы создания задачи ===");
    console.log("Значения формы:", values);

    console.log("=== Клиент: Отправка формы создания задачи ===");
    console.log("Значения формы:", values);
    console.log("Тип deadline:", typeof values.deadline);
    
    createTaskMutation.mutate(values, {
      onSuccess: () => {
        console.log("Задача успешно создана");
        setIsTaskDialogOpen(false);
        taskForm.reset();
      },
      onError: (error: any) => {
        console.error("Ошибка при создании задачи:", error);
        console.error("Детали ошибки:", {
          name: error.name,
          message: error.message,
          response: error.response?.data
        });
      }
    });
  };

  const onAddComment = (values: AddCommentValues) => {
    addCommentMutation.mutate(values, {
      onSuccess: () => {
        commentForm.reset();
      }
    });
  };

  // Функция предварительной проверки файла
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Ошибка",
        description: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / (1024 * 1024)}МБ`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    // Проверка типа файла
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Ошибка",
        description: "Недопустимый тип файла. Разрешены только изображения, документы, таблицы и архивы.",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    // Сохраняем файл в состоянии и открываем диалог для описания
    setSelectedFile(file);
    fileForm.setValue('description', `Файл: ${file.name}`);
    setIsFileDialogOpen(true);
    e.target.value = '';
  };

  // Функция для загрузки файла с описанием
  const handleSubmitFile = (values: FileUploadValues) => {
    if (!selectedFile) return;

    // Отображаем прогресс загрузки
    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', values.description || `Файл: ${selectedFile.name}`);
    formData.append('fileType', selectedFile.type);

    // Имитируем прогресс загрузки
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    uploadFileMutation.mutate(formData, {
      onSuccess: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
          setIsFileDialogOpen(false);
          fileForm.reset();
        }, 500);
      },
      onError: (error) => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        // Обработка ошибки выполняется в хуке useUploadFile
      }
    });
  };

  // Получаем инициалы пользователя для аватарки
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Формат даты создания комментария
  const formatCommentDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'dd.MM.yyyy в HH:mm', { locale: ru });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка возврата */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="gap-1"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад к проектам</span>
        </Button>
        <Badge className={
          project.status === "новый" 
            ? "bg-blue-100 text-blue-800 dark:bg-blue-700/20 dark:text-blue-300" 
            : project.status === "в работе" 
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700/20 dark:text-yellow-300" 
            : "bg-green-100 text-green-800 dark:bg-green-700/20 dark:text-green-300"
        }>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-muted-foreground mt-2">
          Создан {format(new Date(project.createdAt), 'dd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Вкладки проекта */}
      <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="files">Файлы</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="chat">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> Чат
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Обзор проекта */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Описание проекта</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{project.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                    <ClipboardList className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{tasks.length}</div>
                    <p className="text-sm text-muted-foreground">Задач</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                    <File className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{files.length}</div>
                    <p className="text-sm text-muted-foreground">Файлов</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                    <MessageSquare className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{comments.length}</div>
                    <p className="text-sm text-muted-foreground">Комментариев</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                    <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">
                      {tasks.filter(task => task.status === 'завершена').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Завершено</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Последние активности */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Последние активности</CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length > 0 || tasks.length > 0 ? (
                  <div className="space-y-4">
                    {[...tasks, ...comments]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((item, index) => {
                        const isTask = 'title' in item;
                        return (
                          <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                            {isTask ? (
                              <ClipboardList className="h-5 w-5 text-primary mt-1" />
                            ) : (
                              <MessageSquare className="h-5 w-5 text-primary mt-1" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">
                                {isTask 
                                  ? `Создана новая задача: ${(item as any).title}` 
                                  : `Новый комментарий от ${user?.fullName || user?.username}`
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(item.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    В проекте пока нет активностей
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Задачи проекта */}
        <TabsContent value="tasks">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Задачи проекта</h2>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Новая задача
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую задачу</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о задаче, которую нужно выполнить в рамках проекта.
                  </DialogDescription>
                </DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                    <FormField
                      control={taskForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название задачи</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: Разработка логотипа" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание задачи</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Подробно опишите, что нужно сделать" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={taskForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Приоритет</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите приоритет" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="низкий">Низкий</SelectItem>
                                <SelectItem value="средний">Средний</SelectItem>
                                <SelectItem value="высокий">Высокий</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Срок выполнения</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Например: до конца недели" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createTaskMutation.isPending}
                      >
                        {createTaskMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Создание...
                          </>
                        ) : "Создать задачу"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {tasks.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Название</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead>Срок</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[300px]" title={task.title}>
                            {task.title}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]" title={task.description || ""}>
                            {task.description || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={taskStatusLabels[task.status]?.color || "bg-gray-100"}>
                            {taskStatusLabels[task.status]?.label || task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityLabels[task.priority]?.color || "bg-gray-100"}>
                            {priorityLabels[task.priority]?.label || task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(task.createdAt), 'dd.MM.yyyy', { locale: ru })}</TableCell>
                        <TableCell>
                          {task.deadline ? task.deadline : "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onValueChange={(value) => {
                              // Здесь будет логика обновления статуса задачи
                              console.log(`Обновляем задачу ${task.id} на статус ${value}`);
                            }}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Изменить статус" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="новая">Новая</SelectItem>
                              <SelectItem value="в работе">В работе</SelectItem>
                              <SelectItem value="на проверке">На проверке</SelectItem>
                              <SelectItem value="завершена">Завершена</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Задач пока нет</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Создайте первую задачу для этого проекта
                </p>
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  Создать задачу
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Вкладка с чатом */}
        <TabsContent value="chat">
          <div className="flex flex-col">
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">Чат проекта</h2>
              <p className="ml-2 text-sm text-muted-foreground">
                Общайтесь с администратором проекта
              </p>
            </div>

            {/* Чат с администратором (ID администратора = 1) */}
            <ChatInterface 
              projectId={projectId} 
              recipientId={1} 
              className="w-full"
            />
          </div>
        </TabsContent>

        {/* Файлы проекта */}
        <TabsContent value="files">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Файлы проекта</h2>
            <div className="relative">
              <Input
                type="file"
                id="file-upload"
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
                onChange={handleFileUpload}
                disabled={uploadFileMutation.isPending || isUploading}
              />
              <Button className="flex items-center gap-2" disabled={uploadFileMutation.isPending || isUploading}>
                {uploadFileMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    Загрузить файл
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Диалог добавления информации о файле */}
          <Dialog open={isFileDialogOpen} onOpenChange={(open) => {
            // При закрытии диалога сбрасываем выбранный файл если не идет загрузка
            if (!open && !isUploading) {
              setSelectedFile(null);
              fileForm.reset();
            }
            if (!isUploading) {
              setIsFileDialogOpen(open);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Загрузка файла</DialogTitle>
                <DialogDescription>
                  Добавьте описание к файлу для лучшей организации
                </DialogDescription>
              </DialogHeader>

              {selectedFile && (
                <div className="py-2">
                  <div className="mb-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedFile.type && 
                        React.createElement(getFileIcon(selectedFile.type), {
                          className: "h-6 w-6 text-primary"
                        })
                      }
                      <p className="font-medium">{selectedFile.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-1.5" />
                        {(selectedFile.size / 1024).toFixed(1)} КБ
                      </div>
                      <div>
                        {getFileTypeLabel(selectedFile.type) || "Неизвестный тип"}
                      </div>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="my-4">
                      <p className="text-sm text-center mb-2">Загрузка: {uploadProgress}%</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Form {...fileForm}>
                    <form onSubmit={fileForm.handleSubmit(handleSubmitFile)} className="space-y-4">
                      <FormField
                        control={fileForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Описание файла</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Например: Документация проекта" 
                                  className="resize-none"
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
                          disabled={uploadFileMutation.isPending}
                        >
                          {uploadFileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Загрузка...
                            </>
                          ) : "Загрузить"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {files.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {file.fileType && 
                        React.createElement(getFileIcon(file.fileType), {
                          className: "h-6 w-6 text-primary"
                        })
                      }
                      <p className="font-medium truncate" title={file.filename}>{file.filename}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate" title={file.description}>
                      {file.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-1.5" />
                        {(file.fileSize / 1024).toFixed(1)} КБ
                      </div>
                      <div>
                        {getFileTypeLabel(file.fileType) || "Неизвестный тип"}
                      </div>
                    </div>
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Файлов пока нет</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Загрузите первый файл для этого проекта
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Комментарии проекта */}
        <TabsContent value="comments">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Комментарии проекта</h2>
            <p className="text-muted-foreground">
              Обсудите детали проекта с командой
            </p>
          </div>

          {/* Форма добавления комментария */}
          <Card className="mb-4">
            <CardContent>
              <Form {...commentForm}>
                <form onSubmit={commentForm.handleSubmit(onAddComment)} className="space-y-2">
                  <FormField
                    control={commentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ваш комментарий</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Напишите свой комментарий" 
                            className="min-h-[80px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправка...
                      </>
                    ) : "Отправить комментарий"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Список комментариев */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold">{comment.authorName}</CardTitle>
                      <CardDescription className="text-sm">
                        {formatCommentDate(comment.createdAt)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Комментариев пока нет</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Будьте первым, кто оставит комментарий
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
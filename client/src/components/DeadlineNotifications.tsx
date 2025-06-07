import { useEffect, useState } from "react";
import {
  Bell,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/hooks/use-projects";
import { formatDistance, isPast, isToday, addDays, isFuture } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useWebSocket, DeadlineNotification } from "@/hooks/use-websocket";

export function DeadlineNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: projectsData } = useProjects();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { connected, deadlineNotifications } = useWebSocket();

  // Используем WebSocket уведомления, если соединение активно
  // Если нет соединения - используем обычные данные из API
  useEffect(() => {
    // При получении новых уведомлений через WebSocket
    if (connected && deadlineNotifications.length > 0) {
      // Если это первая инициализация или изменилось количество уведомлений
      if (!isInitialized || unreadCount !== deadlineNotifications.length) {
        setUnreadCount(deadlineNotifications.length);
        setIsInitialized(true);
        
        // Показать тост при получении новых уведомлений
        toast({
          title: "Уведомления о дедлайнах",
          description: `У вас ${deadlineNotifications.length} проектов или задач с приближающимися сроками`,
          variant: "default",
        });
      }
    } 
    // Резервный вариант если WebSocket не работает
    else if (!connected && projectsData && projectsData.success) {
      const deadlineItems: DeadlineNotification[] = [];
      const sevenDaysFromNow = addDays(new Date(), 7);

      // Обработка дедлайнов проектов
      projectsData.projects.forEach(project => {
        if (project.deadline && isFuture(new Date(project.deadline)) && 
            new Date(project.deadline) <= sevenDaysFromNow &&
            project.status !== 'завершен') {
          deadlineItems.push({
            id: project.id,
            projectId: project.id,
            projectTitle: project.title,
            title: project.title,
            deadline: new Date(project.deadline),
            type: 'project',
            status: project.status
          });
        }

        // Обработка дедлайнов задач
        if (projectsData.tasks && projectsData.tasks[project.id]) {
          projectsData.tasks[project.id].forEach(task => {
            if (task.deadline && isFuture(new Date(task.deadline)) &&
                new Date(task.deadline) <= sevenDaysFromNow &&
                task.status !== 'завершена') {
              deadlineItems.push({
                id: task.id,
                projectId: project.id,
                projectTitle: project.title,
                title: task.title,
                deadline: new Date(task.deadline),
                type: 'task',
                status: task.status
              });
            }
          });
        }
      });

      // Сортировка уведомлений по дате дедлайна (ближайшие сверху)
      deadlineItems.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
      
      // При первой инициализации установим счетчик непрочитанных
      if (!isInitialized) {
        setUnreadCount(deadlineItems.length);
        setIsInitialized(true);
        
        // Показать тост, если есть уведомления
        if (deadlineItems.length > 0) {
          toast({
            title: "Уведомления о дедлайнах",
            description: `У вас ${deadlineItems.length} проектов или задач с приближающимися сроками`,
            variant: "default",
          });
        }
      }
    }
  }, [projectsData, isInitialized, toast, connected, deadlineNotifications]);

  // Функция для определения цвета бейджа срока
  const getDeadlineBadgeColor = (date: Date) => {
    if (isPast(date)) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
    if (isToday(date)) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  };

  // Функция для получения иконки статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'завершен':
      case 'завершена':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'в работе':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  // Обработчик отметки всех уведомлений как прочитанных
  const handleMarkAllAsRead = () => {
    setUnreadCount(0);
    setOpen(false);
  };

  // Обработчик нажатия на уведомление
  const handleNotificationClick = (item: DeadlineNotification) => {
    if (item.type === 'project') {
      navigate(`/dashboard/${item.projectId}`);
    } else {
      navigate(`/dashboard/${item.projectId}?tab=tasks`);
    }
    setOpen(false);
    
    // Уменьшаем счетчик непрочитанных
    if (unreadCount > 0) {
      setUnreadCount(prev => prev - 1);
    }
  };

  // Определяем, какие уведомления будут отображаться
  // Используем данные из WebSocket, если соединение установлено, иначе используем резервные данные
  const notificationsToShow = connected ? deadlineNotifications : [];
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Уведомления"
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {connected && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"></span>}
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Уведомления о дедлайнах</h4>
            {connected ? 
              <Wifi className="h-4 w-4 text-green-500" /> : 
              <WifiOff className="h-4 w-4 text-red-500" />
            }
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              Отметить все как прочитанные
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[300px] overflow-y-auto">
          {(notificationsToShow && notificationsToShow.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Нет приближающихся дедлайнов</p>
            </div>
          ) : Array.isArray(notificationsToShow) && notificationsToShow.length > 0 ? (
            notificationsToShow.map((item: DeadlineNotification) => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="p-4 hover:bg-muted cursor-pointer"
                onClick={() => handleNotificationClick(item)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.type === 'task' ? `Проект: ${item.projectTitle}` : 'Проект'}
                    </div>
                    <div className="mt-1 flex items-center">
                      <Badge className={cn("font-normal", getDeadlineBadgeColor(item.deadline))}>
                        {isPast(item.deadline) 
                          ? 'Просрочено: ' 
                          : 'Срок: '}
                        {formatDistance(item.deadline, new Date(), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <WifiOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Не удалось загрузить уведомления</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProjects, type ProjectsResponse } from '@/hooks/use-projects';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

type CalendarEvent = {
  id: number;
  title: string;
  date: Date;
  type: 'project' | 'task';
  projectId: number;
  status: string;
};

export function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { data: projectsData } = useProjects();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!projectsData || !projectsData.success) return;

    const calendarEvents: CalendarEvent[] = [];

    // Добавляем дедлайны проектов
    projectsData.projects.forEach(project => {
      if (project.deadline) {
        calendarEvents.push({
          id: project.id,
          title: project.title,
          date: new Date(project.deadline),
          type: 'project',
          projectId: project.id,
          status: project.status
        });
      }
    });

    // Добавляем дедлайны задач
    projectsData.projects.forEach(project => {
      if (projectsData.tasks && projectsData.tasks[project.id]) {
        projectsData.tasks[project.id].forEach(task => {
          if (task.deadline) {
            calendarEvents.push({
              id: task.id,
              title: task.title,
              date: new Date(task.deadline),
              type: 'task',
              projectId: project.id,
              status: task.status
            });
          }
        });
      }
    });

    setEvents(calendarEvents);
  }, [projectsData]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Получить дни текущего месяца для календаря
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ru });
    const endDate = endOfWeek(monthEnd, { locale: ru });

    const rows = [];
    let days = [];
    let day = startDate;

    // Добавляем дни недели (заголовки)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(
        <div key={`header-${i}`} className="text-center font-medium py-2">
          {format(addDays(startOfWeek(new Date(), { locale: ru }), i), 'EEEEEE', { locale: ru })}
        </div>
      );
    }

    rows.push(<div key="header" className="grid grid-cols-7">{weekDays}</div>);

    // Добавляем дни
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = events.filter(event => isSameDay(event.date, day));
        
        days.push(
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-24 border p-1 relative",
              !isSameMonth(day, monthStart) && "bg-muted/50 text-muted-foreground",
              isToday(day) && "bg-yellow-50 dark:bg-yellow-900/10",
            )}
          >
            <div className="text-right p-1">
              <span
                className={cn(
                  "inline-block w-6 h-6 text-center leading-6 text-sm rounded-full",
                  isToday(day) && "bg-primary text-white"
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
            <div className="overflow-y-auto max-h-20 space-y-1">
              {dayEvents.map((event, index) => (
                <DayEvent key={`${event.type}-${event.id}`} event={event} onClick={() => handleEventClick(event)} />
              ))}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      
      days = [];
    }

    return rows;
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'project') {
      navigate(`/dashboard/${event.projectId}`);
    } else {
      navigate(`/dashboard/${event.projectId}?tab=tasks`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Календарь проектов</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Сегодня
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-lg font-medium text-center mt-1">
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {getDaysInMonth()}
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент для отображения события в календаре
function DayEvent({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const getBadgeStyle = () => {
    if (event.type === 'project') {
      return "bg-primary/15 text-primary hover:bg-primary/25";
    } else {
      // Цвет для задачи зависит от статуса
      switch (event.status) {
        case 'новая':
          return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300";
        case 'в работе':
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300";
        case 'на проверке':
          return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300";
        case 'завершена':
          return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300";
        default:
          return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300";
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "text-xs px-1 py-0.5 rounded truncate cursor-pointer",
            getBadgeStyle()
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <div className="font-medium">{event.title}</div>
          <div className="text-sm">
            <span className="text-muted-foreground">Тип: </span>
            {event.type === 'project' ? 'Проект' : 'Задача'}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Дедлайн: </span>
            {format(event.date, 'PPP', { locale: ru })}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Статус: </span>
            <Badge variant="outline" className={getBadgeStyle()}>
              {event.status}
            </Badge>
          </div>
          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={onClick}
          >
            Перейти к {event.type === 'project' ? 'проекту' : 'задаче'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
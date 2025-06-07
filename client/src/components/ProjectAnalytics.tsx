import { useEffect, useState } from "react";
import { useProjects, type ProjectsResponse } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { ru } from "date-fns/locale";
// Определяем типы для конфигурации графиков
type ChartConfig = Record<string, { color: string; label: string }>;

// Цвета для графиков
const COLORS = {
  primary: "#2563eb", // синий
  success: "#10b981", // зеленый
  warning: "#f59e0b", // желтый
  error: "#ef4444",   // красный
  purple: "#8b5cf6",  // фиолетовый
  gray: "#6b7280"     // серый
};

// Конфигурация для графиков
const chartConfig: ChartConfig = {
  // Статусы проектов
  новый: { color: COLORS.primary, label: "Новый" },
  "в работе (проект)": { color: COLORS.warning, label: "В работе" },
  завершен: { color: COLORS.success, label: "Завершен" },
  
  // Статусы задач
  "новая": { color: COLORS.primary, label: "Новая" },
  "в работе (задача)": { color: COLORS.warning, label: "В работе" },
  "на проверке": { color: COLORS.purple, label: "На проверке" },
  "завершена": { color: COLORS.success, label: "Завершена" },
  
  // Приоритеты задач
  низкий: { color: COLORS.gray, label: "Низкий" },
  средний: { color: COLORS.warning, label: "Средний" },
  высокий: { color: COLORS.error, label: "Высокий" }
};

export function ProjectAnalytics() {
  const { data: projectsData } = useProjects();
  const [projectsByStatus, setProjectsByStatus] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);
  const [tasksByPriority, setTasksByPriority] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [monthlyDeadlines, setMonthlyDeadlines] = useState<any[]>([]);

  useEffect(() => {
    if (!projectsData || !projectsData.success) return;

    // Проекты по статусам
    const projectStatusCounts: Record<string, number> = {};
    projectsData.projects.forEach(project => {
      projectStatusCounts[project.status] = (projectStatusCounts[project.status] || 0) + 1;
    });
    
    const projectStatusData = Object.keys(projectStatusCounts).map(status => ({
      name: status,
      value: projectStatusCounts[status]
    }));
    setProjectsByStatus(projectStatusData);

    // Задачи по статусам
    const taskStatusCounts: Record<string, number> = {};
    let allTasks: any[] = [];
    
    projectsData.projects.forEach(project => {
      if (projectsData.tasks && projectsData.tasks[project.id]) {
        projectsData.tasks[project.id].forEach(task => {
          taskStatusCounts[task.status] = (taskStatusCounts[task.status] || 0) + 1;
          allTasks.push(task);
        });
      }
    });
    
    const taskStatusData = Object.keys(taskStatusCounts).map(status => ({
      name: status,
      value: taskStatusCounts[status]
    }));
    setTasksByStatus(taskStatusData);

    // Задачи по приоритетам
    const taskPriorityCounts: Record<string, number> = {};
    allTasks.forEach(task => {
      taskPriorityCounts[task.priority] = (taskPriorityCounts[task.priority] || 0) + 1;
    });
    
    const taskPriorityData = Object.keys(taskPriorityCounts).map(priority => ({
      name: priority,
      value: taskPriorityCounts[priority]
    }));
    setTasksByPriority(taskPriorityData);

    // Активность за неделю (создание задач и комментариев)
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ru });
    const weekEnd = endOfWeek(now, { locale: ru });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyData = weekDays.map(day => {
      const formattedDay = format(day, 'EEEE', { locale: ru });
      const dayTasks = allTasks.filter(task => 
        isSameDay(new Date(task.createdAt), day)
      ).length;
      
      let dayComments = 0;
      projectsData.projects.forEach(project => {
        if (projectsData.comments && projectsData.comments[project.id]) {
          dayComments += projectsData.comments[project.id].filter(comment => 
            isSameDay(new Date(comment.createdAt), day)
          ).length;
        }
      });
      
      return {
        name: formattedDay,
        'Задачи': dayTasks,
        'Комментарии': dayComments
      };
    });
    setWeeklyActivity(weeklyData);

    // Дедлайны по дням месяца
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const monthlyData = monthDays.map(day => {
      const formattedDay = format(day, 'd MMM', { locale: ru });
      
      const projectDeadlines = projectsData.projects.filter(project => 
        project.deadline && isSameDay(new Date(project.deadline), day)
      ).length;
      
      let taskDeadlines = 0;
      projectsData.projects.forEach(project => {
        if (projectsData.tasks && projectsData.tasks[project.id]) {
          taskDeadlines += projectsData.tasks[project.id].filter(task => 
            task.deadline && isSameDay(new Date(task.deadline), day)
          ).length;
        }
      });
      
      return {
        name: formattedDay,
        'Проекты': projectDeadlines,
        'Задачи': taskDeadlines
      };
    });
    setMonthlyDeadlines(monthlyData);
    
  }, [projectsData]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Общий обзор</TabsTrigger>
        <TabsTrigger value="activity">Активность</TabsTrigger>
        <TabsTrigger value="deadlines">Дедлайны</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Проекты по статусам */}
          <Card>
            <CardHeader>
              <CardTitle>Проекты по статусам</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsByStatus.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || "#000"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Задачи по статусам */}
          <Card>
            <CardHeader>
              <CardTitle>Задачи по статусам</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksByStatus.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tasksByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || "#000"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Задачи по приоритетам */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Задачи по приоритетам</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksByPriority.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tasksByPriority}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Количество задач">
                        {tasksByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || "#000"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle>Активность за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyActivity.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyActivity}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Задачи" fill={COLORS.primary} />
                    <Bar dataKey="Комментарии" fill={COLORS.purple} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60">
                <p className="text-muted-foreground">Нет данных для отображения</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="deadlines">
        <Card>
          <CardHeader>
            <CardTitle>Дедлайны в текущем месяце</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyDeadlines.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyDeadlines}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="Проекты" stroke={COLORS.primary} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Задачи" stroke={COLORS.warning} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60">
                <p className="text-muted-foreground">Нет данных для отображения</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, InsertProject, ProjectTask, InsertProjectTask, ProjectComment, InsertProjectComment } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Определим тип данных проектов с задачами и комментариями
export type ProjectsResponse = {
  success: boolean;
  projects: Project[];
  tasks?: Record<number, ProjectTask[]>;
  comments?: Record<number, ProjectComment[]>;
}

// Хук для получения списка проектов пользователя
export function useProjects() {
  const { toast } = useToast();
  
  return useQuery<ProjectsResponse>({
    queryKey: ['/api/projects'],
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/projects', { signal });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка загрузки проектов');
      }
      return await res.json();
    },
    staleTime: 3000, // 3 секунды
    retry: 1,
    gcTime: 5 * 60 * 1000, // 5 минут
  });
}

// Хук для получения данных конкретного проекта с задачами, комментариями и файлами
export function useProject(projectId: number | null) {
  const { toast } = useToast();
  
  return useQuery<{ 
    success: boolean, 
    project: Project, 
    tasks: ProjectTask[], 
    comments: ProjectComment[],
    files: any[]
  }>({
    queryKey: ['/api/projects', projectId],
    queryFn: async ({ signal }) => {
      if (!projectId) throw new Error('Не указан ID проекта');
      
      const res = await fetch(`/api/projects/${projectId}`, { signal });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка загрузки проекта');
      }
      return await res.json();
    },
    enabled: !!projectId,
    staleTime: 3000, // 3 секунды
    retry: 1
  });
}

// Мутация для создания нового проекта
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, project: Project }, Error, Omit<InsertProject, 'userId'>>({
    mutationFn: async (projectData) => {
      const res = await apiRequest('POST', '/api/projects', projectData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Проект создан',
        description: 'Новый проект успешно создан',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка создания проекта',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

// Мутация для обновления проекта
export function useUpdateProject(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, project: Project }, Error, Partial<InsertProject>>({
    mutationFn: async (projectData) => {
      const res = await apiRequest('PUT', `/api/projects/${projectId}`, projectData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Проект обновлен',
        description: 'Проект успешно обновлен',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка обновления проекта',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

// Мутация для создания задачи проекта
export function useCreateTask(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, task: ProjectTask }, Error, Omit<InsertProjectTask, 'projectId'>>({
    mutationFn: async (taskData) => {
      const res = await apiRequest('POST', `/api/projects/${projectId}/tasks`, taskData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: 'Задача добавлена',
        description: 'Новая задача успешно добавлена',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка добавления задачи',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

// Мутация для обновления задачи проекта
export function useUpdateTask(projectId: number, taskId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, task: ProjectTask }, Error, Partial<InsertProjectTask>>({
    mutationFn: async (taskData) => {
      const res = await apiRequest('PUT', `/api/projects/${projectId}/tasks/${taskId}`, taskData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: 'Задача обновлена',
        description: 'Задача успешно обновлена',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка обновления задачи',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

// Мутация для добавления комментария к проекту
export function useAddComment(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, comment: ProjectComment }, Error, { content: string }>({
    mutationFn: async (commentData) => {
      const res = await apiRequest('POST', `/api/projects/${projectId}/comments`, commentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: 'Комментарий добавлен',
        description: 'Новый комментарий успешно добавлен',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка добавления комментария',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

// Мутация для загрузки файла к проекту
export function useUploadFile(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation<{ success: boolean, file: any }, Error, FormData>({
    mutationFn: async (formData) => {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Ошибка загрузки файла');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: 'Файл загружен',
        description: 'Файл успешно загружен',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка загрузки файла',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
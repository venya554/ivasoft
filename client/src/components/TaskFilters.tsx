import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, SlidersHorizontal, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type TaskFilter = {
  status?: string;
  priority?: string;
  search?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  sortBy?: 'createdAt' | 'deadline' | 'title' | 'priority';
  sortDirection?: 'asc' | 'desc';
}

export type TaskFilterProps = {
  onFilterChange: (filters: TaskFilter) => void;
  onResetFilters: () => void;
  filter: TaskFilter;
}

export function TaskFilters({ 
  onFilterChange, 
  onResetFilters, 
  filter
}: TaskFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof TaskFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {/* Поиск */}
          <div className="relative w-64">
            <Input
              placeholder="Поиск задач..."
              value={filter.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="pr-10"
            />
            {filter.search && (
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" 
                onClick={() => handleChange('search', '')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Кнопка фильтров */}
          <Button 
            variant={isOpen ? "secondary" : "outline"} 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Фильтры</span>
          </Button>
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Сортировка:</span>
          <Select
            value={filter.sortBy || 'createdAt'}
            onValueChange={(value) => handleChange('sortBy', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировать по" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Дате создания</SelectItem>
              <SelectItem value="deadline">Сроку выполнения</SelectItem>
              <SelectItem value="title">Названию</SelectItem>
              <SelectItem value="priority">Приоритету</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.sortDirection || 'desc'}
            onValueChange={(value) => handleChange('sortDirection', value as 'asc' | 'desc')}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Порядок" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">По возрастанию</SelectItem>
              <SelectItem value="desc">По убыванию</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Развернутые фильтры */}
      {isOpen && (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Дополнительные фильтры</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onResetFilters}
              >
                Сбросить фильтры
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-4 gap-4">
              {/* Статус задачи */}
              <div>
                <Label htmlFor="status">Статус задачи</Label>
                <Select
                  value={filter.status || ''}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все статусы</SelectItem>
                    <SelectItem value="новая">Новая</SelectItem>
                    <SelectItem value="в работе">В работе</SelectItem>
                    <SelectItem value="на проверке">На проверке</SelectItem>
                    <SelectItem value="завершена">Завершена</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Приоритет задачи */}
              <div>
                <Label htmlFor="priority">Приоритет</Label>
                <Select
                  value={filter.priority || ''}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue placeholder="Все приоритеты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все приоритеты</SelectItem>
                    <SelectItem value="низкий">Низкий</SelectItem>
                    <SelectItem value="средний">Средний</SelectItem>
                    <SelectItem value="высокий">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Дедлайн от */}
              <div>
                <Label>Дедлайн от</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !filter.deadlineFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filter.deadlineFrom ? (
                        format(filter.deadlineFrom, "PPP", { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filter.deadlineFrom}
                      onSelect={(date) => handleChange('deadlineFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Дедлайн до */}
              <div>
                <Label>Дедлайн до</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !filter.deadlineTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filter.deadlineTo ? (
                        format(filter.deadlineTo, "PPP", { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filter.deadlineTo}
                      onSelect={(date) => handleChange('deadlineTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
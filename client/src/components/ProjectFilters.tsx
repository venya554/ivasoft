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

export type ProjectFilter = {
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'deadline' | 'title';
  sortDirection?: 'asc' | 'desc';
}

export type ProjectFilterProps = {
  onFilterChange: (filters: ProjectFilter) => void;
  onResetFilters: () => void;
  filter: ProjectFilter;
  showStatus?: boolean;
}

export function ProjectFilters({ 
  onFilterChange, 
  onResetFilters, 
  filter, 
  showStatus = true 
}: ProjectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof ProjectFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {/* Поиск */}
          <div className="relative w-64">
            <Input
              placeholder="Поиск проектов..."
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
            <div className="grid grid-cols-3 gap-4">
              {/* Статус проекта */}
              {showStatus && (
                <div>
                  <Label htmlFor="status">Статус проекта</Label>
                  <Select
                    value={filter.status || ''}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все статусы</SelectItem>
                      <SelectItem value="новый">Новый</SelectItem>
                      <SelectItem value="в работе">В работе</SelectItem>
                      <SelectItem value="завершен">Завершен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Дата от */}
              <div>
                <Label>Дата от</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !filter.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filter.dateFrom ? (
                        format(filter.dateFrom, "PPP", { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filter.dateFrom}
                      onSelect={(date) => handleChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Дата до */}
              <div>
                <Label>Дата до</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !filter.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filter.dateTo ? (
                        format(filter.dateTo, "PPP", { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filter.dateTo}
                      onSelect={(date) => handleChange('dateTo', date)}
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
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminUser } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface UsersResponse {
  users: AdminUser[];
  total: number;
}

interface UsersTableProps {
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

export default function UsersTable({ onEditUser, onDeleteUser }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", { search, status, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      return response.json();
    },
  });

  // Reset page when search or status changes
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === "all" ? "" : value);
  };

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "moderator":
        return "bg-yellow-100 text-yellow-800";
      case "user":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "moderator":
        return "Модератор";
      case "user":
        return "Пользователь";
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Список пользователей</h3>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Загрузка пользователей...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Список пользователей</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Поиск пользователей..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата создания
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center`}>
                        <span className="text-sm font-medium text-white">
                          {getInitials(user.name)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant="secondary"
                    className={user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {user.active ? "Активен" : "Неактивен"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt ? format(new Date(user.createdAt), "dd.MM.yyyy", { locale: ru }) : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      className="text-primary hover:text-primary-dark"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(user)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.users?.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">Пользователи не найдены</p>
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Предыдущая
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Следующая
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Показано{" "}
              <span className="font-medium">{(page - 1) * limit + 1}</span> до{" "}
              <span className="font-medium">
                {Math.min(page * limit, data?.total || 0)}
              </span>{" "}
              из <span className="font-medium">{data?.total || 0}</span> результатов
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-l-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? "bg-primary text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-r-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </Card>
  );
}
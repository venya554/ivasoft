import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAdminUserSchema, updateAdminUserSchema, AdminUser } from "@shared/schema";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  mode: "create" | "edit";
}

type CreateFormData = z.infer<typeof insertAdminUserSchema>;
type UpdateFormData = z.infer<typeof updateAdminUserSchema>;

export default function UserModal({ isOpen, onClose, user, mode }: UserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isCreate = mode === "create";
  const schema = isCreate ? insertAdminUserSchema : updateAdminUserSchema;

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "user",
      active: true,
    },
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user && mode === "edit") {
      form.reset({
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role as "admin" | "moderator" | "user",
        active: user.active,
      });
    } else if (isOpen && mode === "create") {
      form.reset({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "user",
        active: true,
      });
    }
  }, [isOpen, user, mode, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateFormData) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Успешно",
        description: "Пользователь успешно создан",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при создании пользователя",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFormData) => {
      if (!user?.id) throw new Error("User ID is required");
      return await apiRequest("PUT", `/api/admin/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Успешно",
        description: "Пользователь успешно обновлён",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении пользователя",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFormData | UpdateFormData) => {
    if (isCreate) {
      createMutation.mutate(data as CreateFormData);
    } else {
      updateMutation.mutate(data as UpdateFormData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">
            {isCreate ? "Создать пользователя" : "Редактировать пользователя"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-500">
            Заполните информацию о пользователе
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя и фамилия *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя и фамилию" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя пользователя *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя пользователя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email адрес *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password - only for create mode */}
            {isCreate && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Введите пароль"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="user">Пользователь</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active status */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Активный пользователь</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreate ? "Создать пользователя" : "Сохранить изменения"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Отмена
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
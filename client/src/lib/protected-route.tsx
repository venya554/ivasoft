import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: (props: { params?: any }) => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      </Route>
    );
  }

  return (
    <Route path={path}>
      {(params) => user ? <Component params={params} /> : <Redirect to="/auth" />}
    </Route>
  );
}

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: (props: { params?: any }) => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      </Route>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу авторизации
  if (!user) {
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // Если пользователь не администратор, перенаправляем на дашборд
  if (user && user.role !== "admin") {
    // Показываем уведомление об ошибке доступа
    toast({
      title: "Доступ запрещен",
      description: "У вас нет прав для доступа к панели администратора",
      variant: "destructive",
    });
    
    return (
      <Route path={path}>
        {() => <Redirect to="/dashboard" />}
      </Route>
    );
  }

  // Если пользователь - администратор, показываем компонент
  return (
    <Route path={path}>
      {(params) => <Component params={params} />}
    </Route>
  );
}
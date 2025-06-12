import { Button } from "@/components/ui/button";
import { Bell, LogOut, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "АД";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return user?.email || "Администратор";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Админ-панель</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {getDisplayName(user?.firstName, user?.lastName)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
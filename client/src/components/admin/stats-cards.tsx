import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalUsers?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.activeUsers?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Новые за неделю</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.newUsersThisWeek?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
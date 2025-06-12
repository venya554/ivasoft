import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AdminUser } from "@shared/schema";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  user,
}: DeleteConfirmationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User ID is required");
      return await apiRequest("DELETE", `/api/admin/users/${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Успешно",
        description: "Пользователь успешно удалён",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при удалении пользователя",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Удалить пользователя</DialogTitle>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Вы уверены, что хотите удалить пользователя{" "}
              <span className="font-medium">{user?.name}</span>?{" "}
              Это действие нельзя отменить.
            </p>
          </div>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Удалить
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import AdminHeader from "@/components/admin/admin-header";
import StatsCards from "@/components/admin/stats-cards";
import UsersTable from "@/components/admin/users-table";
import UserModal from "@/components/admin/user-modal";
import DeleteConfirmationModal from "@/components/admin/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AdminUser } from "@shared/schema";

export default function AdminPanel() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode("create");
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode("edit");
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Title and Actions */}
          <div className="mb-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Управление пользователями
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Создание, редактирование и управление пользователями системы
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button onClick={handleCreateUser} className="inline-flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать пользователя
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Users Table */}
          <UsersTable
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      </main>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        user={selectedUser}
        mode={modalMode}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        user={selectedUser}
      />
    </div>
  );
}
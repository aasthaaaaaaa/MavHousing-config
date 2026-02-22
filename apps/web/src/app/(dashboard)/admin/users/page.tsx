'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext';
import { UserDataTable } from '@/components/user-data-table';
import { CreateUserDialog } from '@/components/create-user-dialog';
import { IconPlus } from '@tabler/icons-react';

interface User {
  fName: string;
  lName: string;
  netId: string;
  email: string;
  role: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, loading: authLoading } = useAuth(); // To prevent self-deletion
  const [createOpen, setCreateOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await authApi.get('/auth/get-all');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading]);

  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus className="size-4 mr-1" />
            Create User
          </Button>
          <Button onClick={fetchUsers} variant="outline">Refresh List</Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
         <UserDataTable data={users} onUserUpdated={fetchUsers} />
      </div>
      
      <div className="text-sm text-muted-foreground mt-4">
        Tip: Click on a user's name to view details in a drawer. Drag rows to reorder (local only).
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onUserCreated={fetchUsers}
      />
    </div>
  );
}


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

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
      <div className="h-96 bg-muted animate-pulse rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, edit, and manage staff &amp; student accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus className="size-4 mr-1" />
            Create User
          </Button>
          <Button onClick={fetchUsers} variant="outline">Refresh</Button>
        </div>
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both border rounded-2xl overflow-hidden bg-background"
        style={{ animationDelay: "80ms" }}
      >
         <UserDataTable data={users} onUserUpdated={fetchUsers} />
      </div>
      
      <p className="text-sm text-muted-foreground">Tip: Click on a user's name to view details in a drawer.</p>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onUserCreated={fetchUsers}
      />
    </div>
  );
}


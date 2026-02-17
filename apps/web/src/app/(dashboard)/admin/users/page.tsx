'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext';
import { UserDataTable } from '@/components/user-data-table';

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

  const fetchUsers = async () => {
    try {
      const response = await authApi.get('/auth/users');
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

  // We can keep handleDelete here if we pass it down, or rely on the table handling it.
  // For this iteration, let's just show the table.
  
  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={fetchUsers} variant="outline">Refresh List</Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
         <UserDataTable data={users} />
      </div>
      
      <div className="text-sm text-muted-foreground mt-4">
        Tip: Click on a user's name to view details in a drawer. Drag rows to reorder (local only).
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { authApi } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/context/AuthContext';
import { CreateUserDialog } from '@/components/create-user-dialog';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { getRoleBadgeClass } from '@/lib/role-colors';
import { type UserData } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  IconPlus,
  IconDotsVertical,
} from '@tabler/icons-react';
import {
  Search, ChevronLeft, ChevronRight, Lock, Unlock,
  User, Mail, Shield, Users,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, loading: authLoading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [lockTarget, setLockTarget] = useState<UserData | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [locking, setLocking] = useState(false);

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

  // Universal search
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.netId?.toLowerCase().includes(q) ||
      u.utaId?.toLowerCase().includes(q) ||
      u.fName?.toLowerCase().includes(q) ||
      u.lName?.toLowerCase().includes(q) ||
      `${u.fName} ${u.lName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Reset page on search change
  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = async (netId: string) => {
    if (confirm(`Are you sure you want to delete user ${netId}?`)) {
      try {
        await authApi.delete(`/auth/users/${netId}`);
        toast.success(`User ${netId} deleted`);
        fetchUsers();
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleQuickUnlock = async (u: UserData) => {
    try {
      await authApi.patch(`/auth/users/${u.netId}`, {
        isLocked: false,
        lockReason: null,
      });
      toast.success(`${u.netId} unlocked`);
      fetchUsers();
    } catch {
      toast.error("Failed to unlock account");
    }
  };

  const handleLockWithReason = async () => {
    if (!lockTarget) return;
    setLocking(true);
    try {
      await authApi.patch(`/auth/users/${lockTarget.netId}`, {
        isLocked: true,
        lockReason: lockReason || "Locked by administrator",
      });
      toast.success(`${lockTarget.netId} locked`);
      setLockDialogOpen(false);
      setLockReason('');
      setLockTarget(null);
      fetchUsers();
    } catch {
      toast.error("Failed to lock account");
    } finally {
      setLocking(false);
    }
  };

  // Stats
  const stats = {
    total: users.length,
    students: users.filter(u => u.role?.toLowerCase() === 'student').length,
    staff: users.filter(u => u.role?.toLowerCase() === 'staff').length,
    locked: users.filter(u => u.isLocked).length,
  };

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
      <div className="grid gap-4 grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, edit, and manage user accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus className="size-4 mr-1" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Students", value: stats.students, icon: User, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Staff", value: stats.staff, icon: Shield, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Locked", value: stats.locked, icon: Lock, color: "text-red-500", bg: "bg-red-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="py-0 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both" style={{ animationDelay: "120ms" }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NetID, UTA ID, name, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing {paged.length} of {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* User Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "180ms" }}>
        {paged.length === 0 ? (
          <div className="col-span-2 text-center text-muted-foreground py-16">
            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : paged.map((u, idx) => (
          <Card
            key={u.netId}
            className={`group rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 py-0 gap-0 ${u.isLocked ? "border-destructive/30" : ""}`}
            style={{ animationDelay: `${200 + idx * 30}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  u.isLocked
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {u.isLocked
                    ? <Lock className="h-4 w-4" />
                    : <>{u.fName?.[0]}{u.lName?.[0]}</>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate">{u.fName} {u.lName}</p>
                    {u.isLocked && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">Locked</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{u.netId}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={`${getRoleBadgeClass(u.role)} border text-[10px] capitalize px-2 py-0 h-5`} variant="outline">
                      {u.role?.toLowerCase()}
                    </Badge>
                    {u.utaId && (
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {u.utaId}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <IconDotsVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => { setEditingUser(u); setEditOpen(true); }}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (u.isLocked) {
                        handleQuickUnlock(u);
                      } else {
                        setLockTarget(u);
                        setLockReason('');
                        setLockDialogOpen(true);
                      }
                    }}>
                      {u.isLocked ? (
                        <><Unlock className="h-3.5 w-3.5 mr-1.5" /> Unlock Account</>
                      ) : (
                        <><Lock className="h-3.5 w-3.5 mr-1.5" /> Lock Account</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(u.netId)}>
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 animate-in fade-in duration-300">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onUserCreated={fetchUsers}
      />

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editingUser}
        onUserUpdated={fetchUsers}
      />

      {/* Lock Reason Dialog */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" /> Lock Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent <strong>{lockTarget?.fName} {lockTarget?.lName}</strong> ({lockTarget?.netId}) from logging in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="lockReason" className="text-sm">Reason for locking</Label>
            <Textarea
              id="lockReason"
              placeholder="e.g. Violation of housing policy, unpaid balance..."
              value={lockReason}
              onChange={e => setLockReason(e.target.value)}
              className="mt-1.5 min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockWithReason}
              disabled={locking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {locking ? "Locking..." : "Lock Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

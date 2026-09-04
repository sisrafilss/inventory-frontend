'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { User, Role, UserStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  KeyRound,
  Shield,
  Filter,
  RefreshCw,
  PowerOff,
  Power,
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: Role.MANAGER as Role,
    password: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password Modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Reject Modal
  const [selectedUserForReject, setSelectedUserForReject] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<User[]>('/users', {
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/users', createForm);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        role: Role.MANAGER,
        password: '',
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerify = async (userId: string) => {
    if (!confirm('Verify and activate this Sales Officer?')) return;
    try {
      await api.post(`/users/${userId}/verify`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to verify user.');
    }
  };

  const handleReject = async () => {
    if (!selectedUserForReject) return;
    setIsRejecting(true);
    try {
      await api.post(`/users/${selectedUserForReject.id}/reject`, { reason: rejectReason });
      setSelectedUserForReject(null);
      setRejectReason('');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to reject registration.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status of ${user.name} to ${nextStatus}?`)) return;
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForReset || !newPassword.trim()) return;
    setIsResetting(true);
    try {
      await api.post(`/users/${selectedUserForReset.id}/reset-password`, { newPassword });
      alert('Password reset successfully. The user will be required to change it on next login.');
      setSelectedUserForReset(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> User Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage administrative staff, verify Sales Officers, and control system access
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="">All Roles</option>
              {isSuperAdmin && <option value="ADMIN">Admin</option>}
              <option value="MANAGER">Manager</option>
              <option value="SALES_OFFICER">Sales Officer</option>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading users...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No users found matching your query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">User Details</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Must Change Pwd</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/40">
                      <td className="p-3">
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        {u.phone && <p className="text-[10px] text-muted-foreground">{u.phone}</p>}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            u.role === 'SUPER_ADMIN'
                              ? 'destructive'
                              : u.role === 'ADMIN'
                              ? 'default'
                              : u.role === 'MANAGER'
                              ? 'warning'
                              : 'info'
                          }
                          className="uppercase text-[10px]"
                        >
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            u.status === 'ACTIVE'
                              ? 'success'
                              : u.status === 'PENDING'
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.mustChangePassword ? (
                          <span className="text-amber-600 font-semibold">Yes (Pending)</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {u.createdAt ? formatDate(u.createdAt) : 'N/A'}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* If Pending Sales Officer -> Show Verify / Reject */}
                        {u.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleVerify(u.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => setSelectedUserForReject(u)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}

                        {/* Reset Password */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedUserForReset(u)}
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset Pwd
                        </Button>

                        {/* Activate / Deactivate (cannot mutate self or Super Admin) */}
                        {u.id !== currentUser?.id && u.role !== 'SUPER_ADMIN' && (
                          <Button
                            size="sm"
                            variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <PowerOff className="w-3.5 h-3.5 mr-1 text-destructive" /> Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activate
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add an Administrator or Manager. Managers will be required to change password on first login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Full Name *</label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Email Address *</label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Phone Number</label>
            <Input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Assign Role *</label>
            <Select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
            >
              {isSuperAdmin && <option value="ADMIN">Admin</option>}
              <option value="MANAGER">Manager</option>
              <option value="SALES_OFFICER">Sales Officer</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Initial Password *</label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!selectedUserForReset}
        onOpenChange={(open) => !open && setSelectedUserForReset(null)}
      >
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Target User: <strong>{selectedUserForReset?.name}</strong> ({selectedUserForReset?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold">New Temporary Password *</label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            The user will be required to change this password immediately upon their next login.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUserForReset(null)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleResetPassword}
            disabled={isResetting || !newPassword.trim()}
          >
            {isResetting ? 'Resetting...' : 'Save New Password'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Reject Registration Dialog */}
      <Dialog
        open={!!selectedUserForReject}
        onOpenChange={(open) => !open && setSelectedUserForReject(null)}
      >
        <DialogHeader>
          <DialogTitle>Reject Sales Officer Application</DialogTitle>
          <DialogDescription>
            Rejecting: <strong>{selectedUserForReject?.name}</strong> ({selectedUserForReject?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-semibold">Rejection Reason</label>
          <Input
            placeholder="e.g. Unverified employee reference"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUserForReject(null)}
            disabled={isRejecting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}


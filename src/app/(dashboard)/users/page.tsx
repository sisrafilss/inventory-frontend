'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { User, Role, UserStatus, Warehouse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  PowerOff,
  Power,
  Pencil,
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: Role.MANAGER as Role,
    password: '',
    warehouseId: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    role: Role.MANAGER as Role,
    warehouseId: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Reset Password Modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<Warehouse[]>('/warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

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
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.role === Role.MANAGER && !createForm.warehouseId) {
      alert('Please assign a warehouse for the Manager.');
      return;
    }
    setIsCreating(true);
    try {
      await api.post('/users', {
        ...createForm,
        warehouseId: createForm.warehouseId || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        role: Role.MANAGER,
        password: '',
        warehouseId: '',
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      phone: u.phone || '',
      address: u.address || '',
      role: u.role,
      warehouseId: u.warehouseId || '',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editForm.role === Role.MANAGER && !editForm.warehouseId) {
      alert('Please assign a warehouse for the Manager.');
      return;
    }
    setIsEditing(true);
    try {
      await api.patch(`/users/${editingUser.id}`, {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        role: editForm.role,
        warehouseId: editForm.warehouseId || null,
      });
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user.');
    } finally {
      setIsEditing(false);
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
      alert(t('users.resetNotice'));
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
            <Users className="w-6 h-6 text-primary" /> {t('users.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> {t('users.addUser')}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
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
              <option value="">{t('users.allRoles')}</option>
              {isSuperAdmin && <option value="ADMIN">{t('roles.ADMIN')}</option>}
              <option value="MANAGER">{t('roles.MANAGER')}</option>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="">{t('users.allStatuses')}</option>
              <option value="ACTIVE">{t('statuses.ACTIVE')}</option>
              <option value="INACTIVE">{t('statuses.INACTIVE')}</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('common.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('common.none')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[680px]">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('users.userDetails')}</th>
                    <th className="p-3">{t('users.role')}</th>
                    <th className="p-3">Assigned Warehouse</th>
                    <th className="p-3">{t('common.status')}</th>
                    <th className="p-3">{t('users.mustChangePwd')}</th>
                    <th className="p-3">{t('users.created')}</th>
                    <th className="p-3 text-right">{t('common.actions')}</th>
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
                          {t(`roles.${u.role}`)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.warehouse ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] inline-flex items-center gap-1">
                            {u.warehouse.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">—</span>
                        )}
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
                          {t(`statuses.${u.status}`)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.mustChangePassword ? (
                          <span className="text-amber-600 font-semibold">{t('common.yes')}</span>
                        ) : (
                          <span className="text-muted-foreground">{t('common.no')}</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {u.createdAt ? formatDate(u.createdAt) : t('common.na')}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openEditModal(u)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1 text-primary" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedUserForReset(u)}
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" /> {t('users.resetPwd')}
                        </Button>

                        {u.id !== currentUser?.id && u.role !== 'SUPER_ADMIN' && (
                          <Button
                            size="sm"
                            variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <PowerOff className="w-3.5 h-3.5 mr-1 text-destructive" /> {t('users.deactivate')}
                              </>
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {t('users.activate')}
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
          <DialogTitle>{t('users.createUserTitle')}</DialogTitle>
          <DialogDescription>
            {t('users.createUserDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('auth.fullName')} *</label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('auth.email')} *</label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('auth.phone')}</label>
            <Input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('users.assignRole')} *</label>
            <Select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
            >
              {isSuperAdmin && <option value="ADMIN">{t('roles.ADMIN')}</option>}
              <option value="MANAGER">{t('roles.MANAGER')}</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Assigned Warehouse {createForm.role === 'MANAGER' ? '*' : '(Optional)'}
            </label>
            <Select
              value={createForm.warehouseId}
              onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
              required={createForm.role === 'MANAGER'}
            >
              <option value="">{createForm.role === 'MANAGER' ? '-- Select Warehouse for Manager * --' : '-- No Warehouse Assigned --'}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''} {w.isDefault ? '[Default]' : ''}
                </option>
              ))}
            </Select>
            {createForm.role === 'MANAGER' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Managers can only sell and manage stock in their assigned warehouse.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('users.initialPassword')} *</label>
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? t('common.submitting') : t('users.createAccount')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and assigned warehouse for <strong>{editingUser?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateUser} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('auth.fullName')} *</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('auth.phone')}</label>
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Address</label>
            <Input
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>

          {editingUser?.role !== 'SUPER_ADMIN' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold">{t('users.assignRole')} *</label>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
              >
                {isSuperAdmin && <option value="ADMIN">{t('roles.ADMIN')}</option>}
                <option value="MANAGER">{t('roles.MANAGER')}</option>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Assigned Warehouse {editForm.role === 'MANAGER' ? '*' : '(Optional)'}
            </label>
            <Select
              value={editForm.warehouseId}
              onChange={(e) => setEditForm({ ...editForm, warehouseId: e.target.value })}
              required={editForm.role === 'MANAGER'}
            >
              <option value="">{editForm.role === 'MANAGER' ? '-- Select Warehouse for Manager * --' : '-- No Warehouse Assigned --'}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''} {w.isDefault ? '[Default]' : ''}
                </option>
              ))}
            </Select>
            {editForm.role === 'MANAGER' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Managers can only sell and manage stock in their assigned warehouse.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
              disabled={isEditing}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isEditing}>
              {isEditing ? t('common.submitting') : t('common.save')}
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
          <DialogTitle>{t('users.resetPwdTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.customer')}: <strong>{selectedUserForReset?.name}</strong> ({selectedUserForReset?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('users.newTempPassword')} *</label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('users.resetNotice')}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUserForReset(null)}
            disabled={isResetting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleResetPassword}
            disabled={isResetting || !newPassword.trim()}
          >
            {isResetting ? t('common.submitting') : t('common.save')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

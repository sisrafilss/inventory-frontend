'use client';
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { User, Role, UserStatus, Warehouse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  PowerOff,
  Power,
  Pencil,
  Loader2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [selectedUserRow, setSelectedUserRow] = useState<User | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', email: '', phone: '', role: Role.MANAGER as Role, password: '', warehouseId: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', address: '', role: Role.MANAGER as Role, warehouseId: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const [statusConfirm, setStatusConfirm] = useState<{user: User, newStatus: UserStatus} | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter]);

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
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      
      const res = await api.get<User[]>('/users', {
        page, limit, search: debouncedSearch || undefined, role: roleFilter || undefined, status: statusFilter || undefined,
      });
      
      if (page === 1) setUsers(res.data);
      else setUsers(prev => [...prev, ...res.data]);
      
      if (res.meta) {
        setMeta({ total: res.meta.total || 0, totalPages: res.meta.totalPages || 1 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, roleFilter, statusFilter]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !loadingMore && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.role === Role.MANAGER && !createForm.warehouseId) {
      toast.warning('Please assign a warehouse for the Manager.');
      return;
    }
    setIsCreating(true);
    try {
      await api.post('/users', {
        ...createForm,
        warehouseId: createForm.warehouseId || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', phone: '', role: Role.MANAGER, password: '', warehouseId: '' });
      if (page === 1) fetchUsers(); else setPage(1);
      toast.success('User created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (u: User) => {
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
      toast.warning('Please assign a warehouse for the Manager.');
      return;
    }
    setIsEditing(true);
    try {
      await api.patch(`/users/${editingUser.id}`, {
        ...editForm,
        warehouseId: editForm.warehouseId || undefined,
      });
      setEditingUser(null);
      fetchUsers();
      toast.success('User updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsEditing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    setIsResetting(true);
    try {
      await api.post(`/users/${selectedUserForReset.id}/reset-password`, { newPassword });
      setSelectedUserForReset(null);
      setNewPassword('');
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const confirmStatusUpdate = async () => {
    if (!statusConfirm) return;
    setIsStatusUpdating(true);
    try {
      await api.patch(`/users/${statusConfirm.user.id}/status`, { status: statusConfirm.newStatus });
      setStatusConfirm(null);
      fetchUsers();
      toast.success('Status updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">{t('users.pageTitle')}</h1>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('users.registerUser')}</span>
            </button>
          )}
        </div>

        {/* Gray Filter Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-2 items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 flex-1 max-w-[300px]">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap text-xs uppercase tracking-wider">{t('common.search')}:</label>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap text-xs uppercase tracking-wider">{t('users.role')}:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
            </select>
            
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap text-xs uppercase tracking-wider ml-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive / Blocked</option>
            </select>
            
            <button
              type="button"
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
              className="h-7 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm ml-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div 
          className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-950 relative custom-scrollbar"
          onScroll={handleTableScroll}
        >
          <table className="w-full text-xs text-left min-w-[900px] border-collapse relative">
            <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <tr>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">{t('common.sn')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[150px]">{t('users.userDetails')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-40">{t('users.role')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-48">{t('users.branchWarehouse')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">{t('users.joinedDate')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">{t('common.status')}</th>
                {isSuperAdmin && <th className="px-3 py-1.5 w-32 text-center">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {loading && page === 1 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                      <span>Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center text-rose-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-neutral-400" />
                      <span>No users found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {users.map((u, idx) => {
                    const isSelected = selectedUserRow?.id === u.id;
                    const isActive = u.status === 'ACTIVE';
                    
                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setSelectedUserRow(u)}
                        onDoubleClick={() => isSuperAdmin && openEdit(u)}
                        title={isSuperAdmin ? "Double-click to edit user" : ""}
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{u.name}</span>
                          <span className={`block text-[10px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{u.email}</span>
                          {u.phone && <span className={`block text-[10px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{u.phone}</span>}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            u.role === 'SUPER_ADMIN' ? (isSelected ? 'bg-amber-600 text-white border-amber-500' : 'bg-amber-100 text-amber-800 border-amber-300') :
                            u.role === 'ADMIN' ? (isSelected ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-100 text-purple-800 border-purple-300') :
                            (isSelected ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-100 text-blue-800 border-blue-300')
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {u.warehouse ? (
                            <div className="flex flex-col">
                              <span className="font-semibold">{u.warehouse.name}</span>
                              {u.warehouse.code && <span className="text-[10px] font-mono">Code: {u.warehouse.code}</span>}
                            </div>
                          ) : (
                            <span className="italic opacity-60">All Branches (Global)</span>
                          )}
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {u.createdAt ? formatDate(u.createdAt) : '—'}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            isActive
                              ? isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isSelected ? 'bg-rose-600 text-white border-rose-500' : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected ? 'bg-white text-blue-700 border-white hover:bg-blue-50' : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                                title="Edit Details"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedUserForReset(u); }}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected ? 'bg-white text-blue-700 border-white hover:bg-blue-50' : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 border-neutral-300 dark:border-slate-700 hover:bg-amber-50'
                                }`}
                                title="Reset Password"
                              >
                                <KeyRound className="w-3 h-3" />
                              </button>
                              {u.id !== currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStatusConfirm({ user: u, newStatus: isActive ? 'INACTIVE' : 'ACTIVE' });
                                  }}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-white text-rose-600 border-white hover:bg-rose-50' 
                                      : isActive
                                        ? 'bg-white dark:bg-slate-800 text-rose-600 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                        : 'bg-white dark:bg-slate-800 text-emerald-600 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                  }`}
                                  title={isActive ? 'Deactivate User' : 'Activate User'}
                                >
                                  {isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {loadingMore && (
                    <tr>
                      <td colSpan={isSuperAdmin ? 7 : 6} className="py-4 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                          <span>Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status / Summary Bar */}
        <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 shrink-0">
          <div>
            {t('common.loaded')} <strong>{users.length}</strong> {t('common.of')} <strong>{meta.total}</strong>
          </div>
          <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
            {selectedUserRow ? (
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedUserRow.name} ({selectedUserRow.email})
              </span>
            ) : (
              <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                Tip: {isSuperAdmin ? 'Double-click a row to edit user' : 'Single-click a row to highlight'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col">
          <div data-drag-handle className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <h2 className="text-lg font-bold text-white tracking-wide">Register New User</h2>
            <button type="button" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Full Name <span className="text-rose-600">*</span></label>
              <input required type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Email Address <span className="text-rose-600">*</span></label>
                <input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Phone Number</label>
                <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Role <span className="text-rose-600">*</span></label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })} className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]">
                {isSuperAdmin && <option value="ADMIN">ADMIN</option>}
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Assigned Warehouse {createForm.role === 'MANAGER' ? '*' : ''}</label>
              <select required={createForm.role === 'MANAGER'} value={createForm.warehouseId} onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })} className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]">
                <option value="">{createForm.role === 'MANAGER' ? '-- Select Warehouse for Manager * --' : '-- No Warehouse Assigned (Global) --'}</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ''} {w.isDefault ? '[Default]' : ''}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Initial Password <span className="text-rose-600">*</span></label>
              <input required type="password" placeholder="Min. 6 characters" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-300 dark:border-slate-700 mt-3">
              <button type="button" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isCreating} className="w-32 h-8 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {isCreating ? 'Processing' : 'Register User'}
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* EDIT USER MODAL */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleUpdateUser} className="flex flex-col">
          <div data-drag-handle className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <h2 className="text-lg font-bold text-white tracking-wide">Edit User</h2>
            <button type="button" onClick={() => setEditingUser(null)} disabled={isEditing} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 p-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
              Editing Profile: {editingUser?.email}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Full Name <span className="text-rose-600">*</span></label>
              <input required type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Phone Number</label>
              <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Address</label>
              <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]" />
            </div>
            {editingUser?.role !== 'SUPER_ADMIN' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Role <span className="text-rose-600">*</span></label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })} className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]">
                  {isSuperAdmin && <option value="ADMIN">ADMIN</option>}
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Assigned Warehouse {editForm.role === 'MANAGER' ? '*' : ''}</label>
              <select required={editForm.role === 'MANAGER'} value={editForm.warehouseId} onChange={(e) => setEditForm({ ...editForm, warehouseId: e.target.value })} className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]">
                <option value="">{editForm.role === 'MANAGER' ? '-- Select Warehouse for Manager * --' : '-- No Warehouse Assigned (Global) --'}</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ''}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-300 dark:border-slate-700 mt-3">
              <button type="button" onClick={() => setEditingUser(null)} disabled={isEditing} className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isEditing} className="w-32 h-8 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {isEditing ? 'Processing' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* RESET PASSWORD MODAL */}
      <Dialog
        open={!!selectedUserForReset}
        onOpenChange={(open) => !open && setSelectedUserForReset(null)}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-sm w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleResetPassword} className="flex flex-col">
          <div data-drag-handle className="relative bg-[#800000] dark:bg-rose-950 py-1.5 px-4 select-none border-b border-[#4d0000] dark:border-rose-900 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2"><KeyRound className="w-4 h-4" /> Reset Password</h2>
            <button type="button" onClick={() => setSelectedUserForReset(null)} disabled={isResetting} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-2 text-xs font-mono font-semibold border border-neutral-300 dark:border-slate-700">
              User: {selectedUserForReset?.name} ({selectedUserForReset?.email})
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">New Password <span className="text-rose-600">*</span></label>
              <input required type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Type new password here..." className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-rose-600" />
            </div>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold bg-white/50 dark:bg-slate-900/50 p-2">
              Note: This action forces a new password immediately. Ensure you securely convey the new password to the user.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelectedUserForReset(null)} disabled={isResetting} className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isResetting || !newPassword.trim()} className="w-32 h-8 bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Reset
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Status Confirm Dialog */}
      <ConfirmDialog
        open={!!statusConfirm}
        onOpenChange={(isOpen) => !isStatusUpdating && !isOpen && setStatusConfirm(null)}
        title={`${statusConfirm?.newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} User`}
        description={`Are you sure you want to ${statusConfirm?.newStatus === 'ACTIVE' ? 'activate' : 'deactivate'} this user account? ${statusConfirm?.newStatus === 'INACTIVE' ? 'They will be immediately blocked from logging in.' : ''}`}
        onConfirm={confirmStatusUpdate}
        confirmText={statusConfirm?.newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}
        cancelText="Cancel"
        variant={statusConfirm?.newStatus === 'ACTIVE' ? 'success' : 'danger'}
        isLoading={isStatusUpdating}
        details={statusConfirm ? [
          { label: 'User:', value: statusConfirm.user.name },
          { label: 'Email:', value: statusConfirm.user.email },
          { label: 'Current Status:', value: statusConfirm.user.status },
        ] : []}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { User, KeyRound, CheckCircle2, AlertTriangle, Shield, Save, Loader2, Info } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col items-center py-6 overflow-auto custom-scrollbar">
      <div className="w-full max-w-4xl flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">My Profile & Security</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#9fbcd6] dark:divide-slate-700 bg-white dark:bg-slate-950 flex-1">
          
          {/* Profile Details Panel */}
          <div className="p-4 bg-[#f4f8fc] dark:bg-slate-900/50">
            <div className="flex items-center gap-2 border-b border-neutral-300 dark:border-slate-700 pb-2 mb-4">
              <Info className="w-4 h-4 text-[#0056b3]" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Account Information</h3>
            </div>
            
            <div className="flex items-center gap-4 pb-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-[#004d00] dark:border-emerald-800 text-[#006400] dark:text-emerald-400 flex items-center justify-center font-bold text-2xl uppercase shadow-sm">
                {user.name?.slice(0, 2) || 'US'}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{user.name}</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-0.5">{user.email}</span>
                <span className="inline-flex items-center gap-1 mt-1.5 bg-[#0056b3] text-white px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase w-fit">
                  <Shield className="w-3 h-3" />
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                <tr>
                  <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 w-32 font-bold text-neutral-700 dark:text-neutral-300">Status</th>
                  <td className="p-2 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {user.status}
                  </td>
                </tr>
                <tr>
                  <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 font-bold text-neutral-700 dark:text-neutral-300">Phone</th>
                  <td className="p-2 font-mono font-semibold">{user.phone || '—'}</td>
                </tr>
                <tr>
                  <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 font-bold text-neutral-700 dark:text-neutral-300">Address</th>
                  <td className="p-2">{user.address || '—'}</td>
                </tr>
                <tr>
                  <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 font-bold text-neutral-700 dark:text-neutral-300">Last Login</th>
                  <td className="p-2 font-mono">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Current Session'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Change Password Panel */}
          <div className="p-4 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2 border-b border-neutral-300 dark:border-slate-700 pb-2 mb-4">
              <KeyRound className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Change Password</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-sm rounded-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>Ensure your new password is strong. It should be at least 6 characters long.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Current Password <span className="text-rose-600">*</span>
                </label>
                <input
                  required
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  New Password <span className="text-rose-600">*</span>
                </label>
                <input
                  required
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-600">*</span>
                </label>
                <input
                  required
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full h-9 bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:bg-neutral-500 disabled:border-neutral-600"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

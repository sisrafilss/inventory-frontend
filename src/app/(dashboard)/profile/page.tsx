'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { User, KeyRound, AlertTriangle, Shield, Save, Loader2, Info, Edit3, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile details state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

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

    setIsUpdatingPassword(true);
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
      setIsUpdatingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.username.trim()) {
      toast.error('Username cannot be empty.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await api.patch('/auth/profile', {
        name: profileForm.name.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim() || null,
        phone: profileForm.phone.trim() || null,
        address: profileForm.address.trim() || null,
      });

      await refreshUser();
      setIsEditingProfile(false);
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
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
          <div className="p-4 bg-[#f4f8fc] dark:bg-slate-900/50 flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-slate-700 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0056b3]" />
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Account Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#006400] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isEditingProfile ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-4 pb-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-[#004d00] dark:border-emerald-800 text-[#006400] dark:text-emerald-400 flex items-center justify-center font-bold text-2xl uppercase shadow-sm shrink-0">
                {user.name?.slice(0, 2) || 'US'}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{user.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">@{user.username}</span>
                {user.email && <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{user.email}</span>}
                <span className="inline-flex items-center gap-1 mt-1.5 bg-[#0056b3] text-white px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase w-fit">
                  <Shield className="w-3 h-3" />
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-3 bg-white dark:bg-slate-900 p-3 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Username <span className="text-rose-600">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.replace(/\s+/g, '') })}
                    className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Email Address <span className="text-neutral-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Optional email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Phone Number <span className="text-neutral-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Address <span className="text-neutral-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={isUpdatingProfile}
                    className="h-8 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-xs font-bold hover:bg-neutral-100 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="h-8 px-4 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Profile
                  </button>
                </div>
              </form>
            ) : (
              <table className="w-full text-xs text-left border-collapse border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  <tr>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 w-32 font-bold text-neutral-700 dark:text-neutral-300">Username</th>
                    <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      @{user.username}
                    </td>
                  </tr>
                  <tr>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 font-bold text-neutral-700 dark:text-neutral-300">Email</th>
                    <td className="p-2 font-mono">{user.email || '— (None)'}</td>
                  </tr>
                  <tr>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 font-bold text-neutral-700 dark:text-neutral-300">Status</th>
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
            )}
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
                  disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full h-9 bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:bg-neutral-500 disabled:border-neutral-600"
                >
                  {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

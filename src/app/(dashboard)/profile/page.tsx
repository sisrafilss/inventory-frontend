'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, KeyRound, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> My Profile & Security
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          View account authorization status and update your login credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Account Information</CardTitle>
            <CardDescription className="text-xs">Your registered account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase">
                {user.name?.slice(0, 2) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-muted-foreground block text-[10px]">Role</span>
                <Badge variant="default" className="text-[10px] uppercase font-bold mt-0.5">
                  <Shield className="w-3 h-3 mr-1 inline" />
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Account Status</span>
                <Badge variant="success" className="text-[10px] uppercase font-bold mt-0.5">
                  {user.status}
                </Badge>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Phone</span>
                <span className="font-medium text-foreground">{user.phone || 'Not provided'}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Address</span>
                <span className="font-medium text-foreground">{user.address || 'Not provided'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-muted-foreground block text-[10px]">Last Login</span>
                <span className="font-medium text-foreground">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Currently active session'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Update Password
            </CardTitle>
            <CardDescription className="text-xs">
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-3 text-xs">
              {error && (
                <div className="p-2.5 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2 text-destructive font-medium">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">New Password</label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button type="submit" size="sm" className="w-full font-semibold" disabled={isUpdating}>
                {isUpdating ? 'Updating Password...' : 'Change Password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}


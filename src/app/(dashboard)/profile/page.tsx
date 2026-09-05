'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, KeyRound, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

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
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordLengthError'));
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
      setError(err.message || t('profile.updatePassword'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> {t('profile.title')}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">{t('profile.accountInfo')}</CardTitle>
            <CardDescription className="text-xs">{t('profile.accountInfoDesc')}</CardDescription>
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
                <span className="text-muted-foreground block text-[10px]">{t('users.role')}</span>
                <Badge variant="default" className="text-[10px] uppercase font-bold mt-0.5">
                  <Shield className="w-3 h-3 mr-1 inline" />
                  {user.role === 'SUPER_ADMIN'
                    ? t('roles.SUPER_ADMIN')
                    : user.role === 'ADMIN'
                    ? t('roles.ADMIN')
                    : t('roles.MANAGER')}
                </Badge>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">{t('users.status')}</span>
                <Badge variant="success" className="text-[10px] uppercase font-bold mt-0.5">
                  {user.status === 'ACTIVE'
                    ? t('statuses.active')
                    : user.status === 'PENDING'
                    ? t('statuses.pending')
                    : t('statuses.inactive')}
                </Badge>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">{t('users.phone')}</span>
                <span className="font-medium text-foreground">{user.phone || '—'}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">{t('users.address')}</span>
                <span className="font-medium text-foreground">{user.address || '—'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-muted-foreground block text-[10px]">{t('profile.lastLogin')}</span>
                <span className="font-medium text-foreground">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('profile.activeSession')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> {t('profile.updatePassword')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('profile.updatePasswordDesc')}
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
                <label className="font-semibold text-foreground">{t('auth.currentPassword')}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('auth.newPassword')}</label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('auth.confirmNewPassword')}</label>
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
                {isUpdating ? '...' : t('profile.changePasswordBtn')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}


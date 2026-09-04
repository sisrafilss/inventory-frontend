'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

function ChangePasswordContent() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true' || user?.mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      await refreshUser();

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-md border-border">
        <CardHeader className="space-y-1">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-center">Change Password</CardTitle>
          <CardDescription className="text-center">
            {isRequired
              ? 'Security Policy: You are required to update your initial temporary password before continuing.'
              : 'Enter your current password and choose a new secure password.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5">
            {isRequired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                Initial password change required for security compliance.
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-sm text-destructive font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-sm text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Password changed successfully! Redirecting to dashboard...</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Current / Initial Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" /> New Password
              </label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" /> Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
          <div className="text-xs text-muted-foreground font-medium">Loading security verification...</div>
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}


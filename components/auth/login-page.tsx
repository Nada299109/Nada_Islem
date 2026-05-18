'use client'

import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

type Step = 'credentials' | 'otp' | 'change_password'

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const {
    login,
    verifyLoginOtp,
    completeFirstLogin,
    loginAsDemo,
    isLoading,
    error,
  } = useContext(AuthContext)
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('nada.br@intraconnect.com')
  const [password, setPassword] = useState('demo123')
  const [otp, setOtp] = useState('')
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)

  useEffect(() => {
    if (step !== 'otp' || !expiresAt) return
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [step, expiresAt])

  const resetToStart = () => {
    setStep('credentials')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setChallengeToken(null)
    setExpiresAt(null)
    setLocalError(null)
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    try {
      const outcome = await login(email, password)
      if (outcome.kind === 'otp_required') {
        setChallengeToken(outcome.challengeToken)
        setExpiresAt(outcome.expiresAt)
        setStep('otp')
      } else if (outcome.kind === 'password_change_required') {
        setStep('change_password')
      }
    } catch {
      // error already surfaced via context
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!challengeToken) return
    try {
      await verifyLoginOtp(challengeToken, otp.trim())
    } catch {
      // error surfaced via context
    }
  }

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }
    try {
      await completeFirstLogin(email, otp.trim(), newPassword)
    } catch {
      // error surfaced via context
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <span className="text-2xl font-bold tracking-tight">IntraConnect</span>
          </div>
        </div>

        <div className="relative space-y-6 text-white">
          <h1 className="text-4xl font-bold leading-tight">
            Modern HR for modern teams.
          </h1>
          <p className="text-slate-300 text-lg max-w-md">
            Leaves, payroll, attendance, help desk and onboarding — every workflow in one secure portal.
          </p>

          <div className="grid grid-cols-1 gap-3 max-w-sm pt-4">
            <div className="flex items-center gap-3 text-slate-200">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-sm">OTP-secured login + first-login password reset</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <KeyRound size={18} className="text-emerald-400" />
              <span className="text-sm">Role-based access for Admin, HR, Manager, Employee</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <Lock size={18} className="text-emerald-400" />
              <span className="text-sm">Immutable audit trail on every action</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          charge.docx Phase-1 demo · {new Date().getFullYear()} IntraConnect
        </p>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <Card className="w-full max-w-md p-8 bg-white shadow-xl border-slate-200">
          {step !== 'credentials' && (
            <button
              type="button"
              onClick={resetToStart}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4"
            >
              <ArrowLeft size={14} /> Back to sign-in
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {step === 'credentials' && 'Welcome back'}
              {step === 'otp' && 'Verify it\'s you'}
              {step === 'change_password' && 'Set your password'}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              {step === 'credentials' && 'Sign in to access IntraConnect.'}
              {step === 'otp' && `We sent a 6-digit code to ${email}. It expires in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}.`}
              {step === 'change_password' && 'First-time login. Enter the OTP from HR and choose a new password.'}
            </p>
          </div>

          {displayError && (
            <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
              {displayError}
            </Alert>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                {isLoading ? 'Signing in…' : 'Continue'}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={loginAsDemo}
                className="w-full h-11"
              >
                Enter demo environment
              </Button>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 text-center">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create one
                  </button>
                </p>
                <details className="mt-4 text-xs text-slate-500">
                  <summary className="cursor-pointer">Demo accounts</summary>
                  <div className="mt-2 space-y-1 font-mono">
                    <p>Admin — nada.br@intraconnect.com / demo123</p>
                    <p>Manager — akram.tr@intraconnect.com / demo123</p>
                    <p>HR — sami.gh@intraconnect.com / demo123</p>
                    <p>Employee — olfa.hm@intraconnect.com / demo123</p>
                  </div>
                </details>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">6-digit code</label>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                {isLoading ? 'Verifying…' : 'Verify & sign in'}
              </Button>

              {countdown === 0 && (
                <p className="text-xs text-rose-600 text-center">
                  Code expired — please restart sign-in.
                </p>
              )}
            </form>
          )}

          {step === 'change_password' && (
            <form onSubmit={handleFirstLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Activation OTP</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP from HR"
                  className="font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                {isLoading ? 'Activating…' : 'Activate account'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

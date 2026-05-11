'use client'

import { useContext, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, loginAsDemo, isLoading, error } = useContext(AuthContext)
  const [email, setEmail] = useState('employee@example.com')
  const [password, setPassword] = useState('demo123')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">IntraConnect</h1>
          <p className="text-slate-600 mt-2">Frontend-only sprint demo. No backend required.</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 text-red-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              <p>{error}</p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-fit"
                onClick={loginAsDemo}
              >
                Enter Demo Mode
              </Button>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo123"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={loginAsDemo}
            className="w-full border-blue-200 hover:bg-blue-50 text-blue-700 h-11 font-medium transition-colors"
          >
            Access Demo Environment
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 mb-2">Demo accounts</p>
            <p>Admin — `nada.br@intraconnect.com` / `demo123`</p>
            <p>Manager — `akram.tr@intraconnect.com` / `demo123`</p>
            <p>HR — `sami.gh@intraconnect.com` / `demo123`</p>
            <p>Employee — `olfa.hm@intraconnect.com` / `demo123`</p>
          </div>
          <p className="text-sm text-slate-600 text-center">Don&apos;t have an account?</p>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={onSwitchToRegister}
          >
            Create Account
          </Button>
        </div>
      </Card>
    </div>
  )
}

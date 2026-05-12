'use client'

import { createContext, useEffect, useMemo, useState, ReactNode } from 'react'

import { DEMO_APP_STATE_KEY, DEMO_AUTH_STATE_KEY, createId } from '@/lib/demo-storage'

export interface User {
  id: string
  email: string
  name: string
  role: string
  employeeId?: string
  department?: string
  position?: string
  roleId?: string
  roleName?: string
  permissions?: string[]
}

interface StoredAccount extends User {
  password: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loginAsDemo: () => void
  isLoading: boolean
  error: string | null
}

const defaultAccounts: StoredAccount[] = [
  {
    id: 'user-virtide-admin',
    email: 'admin@virtide.com',
    name: 'Admin System',
    role: 'admin',
    employeeId: '0',
    department: 'IT',
    position: 'IT Manager',
    password: 'Admin123!',
  },
  {
    id: 'user-admin',
    email: 'nada.br@intraconnect.com',
    name: 'Nada Ben Romdhane',
    role: 'admin',
    employeeId: '1',
    department: 'Executive',
    position: 'Chief Executive Officer',
    password: 'demo123',
  },
  {
    id: 'user-manager',
    email: 'akram.tr@intraconnect.com',
    name: 'Akram Trimech',
    role: 'manager',
    employeeId: '2',
    department: 'Engineering',
    position: 'VP of Engineering',
    password: 'demo123',
  },
  {
    id: 'user-hr',
    email: 'sami.gh@intraconnect.com',
    name: 'Sami Gharbi',
    role: 'hr',
    employeeId: '4',
    department: 'HR',
    position: 'HR Director',
    password: 'demo123',
  },
  {
    id: 'user-employee',
    email: 'olfa.hm@intraconnect.com',
    name: 'Olfa Hammami',
    role: 'employee',
    employeeId: '7',
    department: 'Engineering',
    position: 'Backend Developer',
    password: 'demo123',
  },
]

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loginAsDemo: () => {},
  isLoading: false,
  error: null,
})

function readStoredAuthState() {
  if (typeof window === 'undefined') {
    return { user: null as User | null, accounts: defaultAccounts }
  }

  const stored = window.localStorage.getItem(DEMO_AUTH_STATE_KEY)
  if (!stored) {
    return { user: null as User | null, accounts: defaultAccounts }
  }

  try {
    const parsed = JSON.parse(stored)
    return {
      user: (parsed.user as User | null) || null,
      accounts: (parsed.accounts as StoredAccount[]) || defaultAccounts,
    }
  } catch {
    return { user: null as User | null, accounts: defaultAccounts }
  }
}

function enrichFromEmployee(email: string) {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.localStorage.getItem(DEMO_APP_STATE_KEY)
    if (!stored) return {}

    const parsed = JSON.parse(stored)
    const employee = parsed?.employees?.find?.((item: any) => item.email?.toLowerCase() === email.toLowerCase())

    if (!employee) return {}

    return {
      employeeId: employee.id as string,
      department: employee.department as string,
      position: employee.position as string,
      name: employee.name as string,
      role: (employee.roleCode as string) || 'employee',
      roleId: employee.roleId as string,
      roleName: employee.roleName as string,
      permissions: (employee.permissions as string[]) || [],
    }
  } catch {
    return {}
  }
}

function persistAuthState(user: User | null, accounts: StoredAccount[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    DEMO_AUTH_STATE_KEY,
    JSON.stringify({ user, accounts }),
  )
}

function ensureEmployeeForAccount(account: StoredAccount) {
  if (typeof window === 'undefined') return account

  const enriched = enrichFromEmployee(account.email)
  if (!enriched.employeeId) {
    return account
  }

  return {
    ...account,
    ...enriched,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<StoredAccount[]>(defaultAccounts)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStoredAuthState()
    const hydratedAccounts = stored.accounts.map(ensureEmployeeForAccount)
    const hydratedUser = stored.user
      ? ensureEmployeeForAccount({
          ...stored.user,
          password: '',
        })
      : null

    setAccounts(hydratedAccounts)

    // Auto-login as demo admin if no session exists (demo mode – no backend required)
    const resolvedUser: User | null = hydratedUser
      ? {
          id: hydratedUser.id,
          email: hydratedUser.email,
          name: hydratedUser.name,
          role: hydratedUser.role,
          employeeId: hydratedUser.employeeId,
          department: hydratedUser.department,
          position: hydratedUser.position,
          roleId: hydratedUser.roleId,
          roleName: hydratedUser.roleName,
          permissions: hydratedUser.permissions,
        }
      : (() => {
          const demoAccount = ensureEmployeeForAccount(defaultAccounts[0])
          return {
            id: demoAccount.id,
            email: demoAccount.email,
            name: demoAccount.name,
            role: demoAccount.role,
            employeeId: demoAccount.employeeId,
            department: demoAccount.department,
            position: demoAccount.position,
            roleId: demoAccount.roleId,
            roleName: demoAccount.roleName,
            permissions: demoAccount.permissions,
          }
        })()

    setUser(resolvedUser)
    persistAuthState(resolvedUser, hydratedAccounts)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const account = accounts.find(item => item.email.toLowerCase() === normalizedEmail)

      if (account && account.password === password) {
        const hydrated = ensureEmployeeForAccount(account)
        const nextUser: User = {
          id: hydrated.id,
          email: hydrated.email,
          name: hydrated.name,
          role: hydrated.role,
          employeeId: hydrated.employeeId,
          department: hydrated.department,
          position: hydrated.position,
          roleId: hydrated.roleId,
          roleName: hydrated.roleName,
          permissions: hydrated.permissions,
        }

        setUser(nextUser)
        persistAuthState(nextUser, accounts.map(ensureEmployeeForAccount))
        return
      }

      // No demo match — try the real backend.
      let response: Response
      try {
        response = await fetch('http://localhost:3001/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: normalizedEmail, password }),
        })
      } catch {
        throw new Error('Connection failed: the backend is unreachable. Please check that the backend is running on port 3001.')
      }

      if (!response.ok) {
        throw new Error('Invalid email or password.')
      }

      const data = await response.json()
      const backendUser = data?.user ?? {}
      const roles = Array.isArray(backendUser.roles) ? backendUser.roles : []
      const primaryRole = roles[0] ?? {}
      const permissions: string[] = roles
        .flatMap((r: any) => Array.isArray(r?.permissions) ? r.permissions : [])
        .map((p: any) => `${p.module}.${p.action}`)

      const nextUser: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.employee?.fullName || backendUser.username || normalizedEmail,
        role: primaryRole.code || primaryRole.name || 'employee',
        employeeId: backendUser.employee?.id,
        department: backendUser.employee?.department?.name,
        position: backendUser.employee?.jobTitle?.title,
        roleId: primaryRole.id,
        roleName: primaryRole.name,
        permissions,
      }

      if (typeof window !== 'undefined' && data?.accessToken) {
        window.localStorage.setItem('accessToken', data.accessToken)
      }

      setUser(nextUser)
      persistAuthState(nextUser, accounts.map(ensureEmployeeForAccount))
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (accounts.some(item => item.email.toLowerCase() === normalizedEmail)) {
        throw new Error('An account with this email already exists.')
      }

      const employeeId = createId('emp')
      const accountId = createId('user')

      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(DEMO_APP_STATE_KEY)
        const parsed = stored ? JSON.parse(stored) : {}
        const employees = Array.isArray(parsed?.employees) ? parsed.employees : []
        parsed.employees = [
          ...employees,
          {
            id: employeeId,
            name,
            email: normalizedEmail,
            phone: '+216 00 000 000',
            department: 'General',
            position: 'New Employee',
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active',
            roleId: 'role-employee',
            roleName: 'Employee',
            roleCode: 'employee',
            permissions: [
              'profile.read',
              'profile.update',
              'leave.create',
              'leave.read',
              'tickets.create',
              'tickets.read',
              'documents.read',
              'feedback.submit',
              'tools.read',
            ],
          },
        ]
        window.localStorage.setItem(DEMO_APP_STATE_KEY, JSON.stringify(parsed))
      }

      const newAccount: StoredAccount = {
        id: accountId,
        email: normalizedEmail,
        name,
        role: 'employee',
        employeeId,
        department: 'General',
        position: 'New Employee',
        password,
      }

      const nextAccounts = [...accounts, newAccount]
      const nextUser: User = {
        id: newAccount.id,
        email: newAccount.email,
        name: newAccount.name,
        role: newAccount.role,
        employeeId: newAccount.employeeId,
        department: newAccount.department,
        position: newAccount.position,
        roleId: 'role-employee',
        roleName: 'Employee',
        permissions: [
          'profile.read',
          'profile.update',
          'leave.create',
          'leave.read',
          'tickets.create',
          'tickets.read',
          'documents.read',
          'feedback.submit',
          'tools.read',
        ],
      }

      setAccounts(nextAccounts)
      setUser(nextUser)
      persistAuthState(nextUser, nextAccounts)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('accessToken')
    }
    fetch('http://localhost:3001/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setUser(null)
    persistAuthState(null, accounts)
  }

  const loginAsDemo = () => {
    const demoAccount = ensureEmployeeForAccount(defaultAccounts[0])
    const demoUser: User = {
      id: demoAccount.id,
      email: demoAccount.email,
      name: demoAccount.name,
      role: demoAccount.role,
      employeeId: demoAccount.employeeId,
      department: demoAccount.department,
      position: demoAccount.position,
      roleId: demoAccount.roleId,
      roleName: demoAccount.roleName,
      permissions: demoAccount.permissions,
    }

    setError(null)
    setUser(demoUser)
    persistAuthState(demoUser, accounts)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      loginAsDemo,
      isLoading,
      error,
    }),
    [user, isLoading, error, accounts],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

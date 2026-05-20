'use client'

import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import LoginPageComponent from '@/components/auth/login-page'
import MainLayoutComponent from '@/components/layout/main-layout'

export default function HomePage() {
  const { user } = useContext(AuthContext)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPageComponent />
  }

  return <MainLayoutComponent />
}

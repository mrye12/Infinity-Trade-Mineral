'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/navigation'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Check if current path is an auth page
  const isAuthPage = pathname.startsWith('/auth/')
  
  if (isAuthPage) {
    // For auth pages, render children directly without navigation
    return <>{children}</>
  }
  
  // For all other pages, render with navigation
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {children}
      </main>
    </>
  )
}

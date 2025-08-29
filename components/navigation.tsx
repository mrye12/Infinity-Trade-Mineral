'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getUser, getUserProfile, signOut } from '@/lib/auth'
import type { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building2, 
  FileText, 
  Receipt, 
  Truck, 
  Package, 
  LayoutDashboard,
  User as UserIcon,
  Users,
  LogOut,
  Menu
} from 'lucide-react'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      try {
        const { user: authUser } = await getUser()
        
        if (authUser) {
          setUser(authUser)
          const profile = await getUserProfile(authUser.id)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Don't render navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  // Don't render if still loading or no user
  if (isLoading || !user || !userProfile) {
    return null
  }

  const isAdmin = userProfile.role === 'admin'
  const isStaff = userProfile.role === 'staff'

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      show: true,
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: Receipt,
      show: isAdmin,
    },
    {
      name: 'Shipments',
      href: '/shipments',
      icon: Truck,
      show: true,
    },
    {
      name: 'Office Stock',
      href: '/stock',
      icon: Package,
      show: isAdmin,
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      show: isAdmin,
    },
  ]

  const visibleItems = navigationItems.filter(item => item.show)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Company Name */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                Infinity Trade Mineral
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                Management System
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={isAdmin ? "destructive" : "secondary"} 
              className={`hidden sm:inline-flex font-medium px-3 py-1 ${
                isAdmin 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white border-0'
              }`}
            >
              {userProfile.role.toUpperCase()}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="p-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg">
                    <UserIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {userProfile.full_name || userProfile.email.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                <DropdownMenuLabel className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {userProfile.full_name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {userProfile.email}
                      </p>
                      <div className="mt-1">
                        <Badge 
                          variant={isAdmin ? "destructive" : "secondary"} 
                          className={`text-xs px-2 py-0.5 ${
                            isAdmin 
                              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {userProfile.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                
                {/* Mobile Navigation Items */}
                <div className="lg:hidden space-y-1 py-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <DropdownMenuItem key={item.name} asChild className="p-0">
                        <Link 
                          href={item.href} 
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700 my-2" />
                </div>

                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}

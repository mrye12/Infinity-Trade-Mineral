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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Company Name */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Infinity Trade Mineral</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Badge variant={isAdmin ? "destructive" : "secondary"} className="hidden sm:inline-flex">
              {userProfile.role.toUpperCase()}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {userProfile.full_name || userProfile.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {userProfile.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userProfile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Navigation Items */}
                <div className="md:hidden">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
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

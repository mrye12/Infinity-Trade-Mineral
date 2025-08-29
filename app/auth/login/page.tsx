'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
// import '@/styles/login-premium.css'
// import { motion } from 'framer-motion'

import { signInWithEmail } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Gem,
  Mountain,
  Truck,
  Shield
} from 'lucide-react'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const redirectTo = '/dashboard'

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signInWithEmail(data.email, data.password)

      if (!result.success) {
        setError(result.error?.message || 'An error occurred during sign in')
        return
      }

      // Successful login - redirect to intended page
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Left Side - Industrial Imagery & Branding */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1f2937 0%, #334155 50%, #1f2937 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 4rem',
        maxWidth: '56rem'
      }} className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, rgba(31,41,55,0.9) 0%, rgba(31,41,55,0.7) 50%, transparent 100%)'
        }}></div>
        
        {/* Mining/Industrial Geometric Elements */}
        <div style={{
          position: 'absolute',
          top: '5rem',
          right: '5rem',
          width: '8rem',
          height: '8rem',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          transform: 'rotate(45deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '8rem',
          right: '8rem',
          width: '6rem',
          height: '6rem',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          transform: 'rotate(12deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '2.5rem',
          width: '4rem',
          height: '4rem',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '50%'
        }}></div>
        
        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 4rem',
          maxWidth: '32rem'
        }}>
          {/* Logo & Company */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)'
              }}>
                <Gem style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '-0.025em',
                  margin: 0
                }}>Infinity Trade Mineral</h1>
                <p style={{
                  color: '#fcd34d',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>PREMIUM MINING ENTERPRISE</p>
              </div>
            </div>
            
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, #f59e0b 0%, #fcd34d 50%, transparent 100%)',
              marginBottom: '2rem'
            }} />
          </div>

          {/* Main Tagline */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 4vw, 3rem)',
              fontWeight: '700',
              color: 'white',
              lineHeight: '1.2',
              marginBottom: '1.5rem'
            }}>
              Industrial Excellence
              <span style={{ display: 'block', color: '#fcd34d' }}>at Your Fingertips</span>
            </h2>
            <p style={{
              color: '#d1d5db',
              fontSize: '1.125rem',
              lineHeight: '1.75'
            }}>
              Advanced enterprise management platform for premium mineral trading operations. 
              Secure, powerful, and built for industry leaders.
            </p>
          </div>

          {/* Feature Icons */}
          <div className="premium-features-grid">
            <div className="premium-feature-card">
              <div className="premium-feature-icon">
                <Mountain />
              </div>
              <div className="premium-feature-text">
                <h3>Mining Operations</h3>
                <p>Resource Management</p>
              </div>
            </div>
            
            <div className="premium-feature-card">
              <div className="premium-feature-icon">
                <Truck />
              </div>
              <div className="premium-feature-text">
                <h3>Logistics Control</h3>
                <p>Supply Chain</p>
              </div>
            </div>
            
            <div className="premium-feature-card">
              <div className="premium-feature-icon">
                <Building2 />
              </div>
              <div className="premium-feature-text">
                <h3>Enterprise Suite</h3>
                <p>Business Intelligence</p>
              </div>
            </div>
            
            <div className="premium-feature-card">
              <div className="premium-feature-icon">
                <Shield />
              </div>
              <div className="premium-feature-text">
                <h3>Secure Access</h3>
                <p>Data Protection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="premium-right-panel">
        <div className="premium-form-container">
          {/* Mobile Logo */}
          <div className="premium-mobile-logo">
            <div className="premium-mobile-logo-card">
              <div className="premium-mobile-logo-icon">
                <Gem />
              </div>
              <div className="premium-mobile-logo-text">
                <h1>Infinity Trade Mineral</h1>
                <p>PREMIUM ENTERPRISE</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="premium-login-card">
            {/* Card Header */}
            <div className="premium-card-header">
              <div className="premium-header-icon">
                <Building2 />
              </div>
              <h2 className="premium-header-title">
                Secure Access Portal
              </h2>
              <p className="premium-header-subtitle">
                Enter your credentials to access the management system
              </p>
            </div>

            {/* Form Content */}
            <div className="premium-form-content">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="premium-form">
                  {error && (
                    <div>
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@company.com"
                              disabled={isLoading}
                              autoComplete="email"
                              className="pl-12 h-12 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your secure password"
                              disabled={isLoading}
                              autoComplete="current-password"
                              className="pl-12 pr-12 h-12 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-600 font-normal">
                            Remember me
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    )}
                    {isLoading ? 'Authenticating...' : 'Access Management Portal'}
                  </Button>
                </form>
              </Form>

              {/* Additional Links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Need access?{' '}
                  <Link
                    href="/auth/register"
                    className="font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Contact Administrator
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
            <p className="text-xs text-gray-500 font-medium">
              © 2024 Infinity Trade Mineral – Internal Use Only
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Secure Enterprise Access • Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}

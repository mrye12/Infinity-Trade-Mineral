'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { signInWithEmail } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
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
    defaultValues: { email: '', password: '', rememberMe: false },
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
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(96,165,250,0.08) 0%, transparent 40%)',
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        position: 'relative',
        zIndex: 10,
        margin: '0 1rem'
      }}>
        
        {/* Company Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
            }}>
              <Building2 style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'white',
              margin: 0
            }}>
              Infinity Trade Mineral
            </h1>
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          
          {/* Header */}
          <div style={{
            background: '#0f172a',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              margin: '0 0 0.25rem 0'
            }}>
              Login
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              margin: 0
            }}>
              Enter your credentials to continue
            </p>
          </div>

          {/* Form Content */}
          <div style={{ padding: '2rem' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        Email
                      </FormLabel>
                      <FormControl>
                        <div style={{ position: 'relative' }}>
                          <Mail style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            color: '#9ca3af'
                          }} />
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.email@company.com"
                            disabled={isLoading}
                            autoComplete="email"
                            style={{
                              width: '100%',
                              height: '44px',
                              paddingLeft: '40px',
                              paddingRight: '12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        Password
                      </FormLabel>
                      <FormControl>
                        <div style={{ position: 'relative' }}>
                          <Lock style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            color: '#9ca3af'
                          }} />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            autoComplete="current-password"
                            style={{
                              width: '100%',
                              height: '44px',
                              paddingLeft: '40px',
                              paddingRight: '40px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#9ca3af',
                              cursor: 'pointer'
                            }}
                          >
                            {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember & Forgot */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel style={{
                          fontSize: '0.875rem',
                          fontWeight: '400',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Link
                    href="/auth/forgot-password"
                    style={{
                      fontSize: '0.875rem',
                      color: '#d97706',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            {/* Footer */}
            <div style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Need access?{' '}
              <Link
                href="/auth/register"
                style={{
                  color: '#d97706',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Contact Administrator
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            margin: 0
          }}>
            © 2024 Infinity Trade Mineral
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
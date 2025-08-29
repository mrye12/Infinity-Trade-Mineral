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
  Shield,
  ArrowRight,
  Star
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      {/* Left Panel - Premium Branding */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '4rem 6rem 4rem 4rem',
        position: 'relative',
        zIndex: 1,
        maxWidth: '50%'
      }} className="hidden lg:flex">
        
        {/* Company Logo & Title */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)',
              position: 'relative'
            }}>
              <Gem style={{ 
                width: '1.75rem', 
                height: '1.75rem', 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} />
              <div style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
                width: '1rem',
                height: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star style={{ width: '0.5rem', height: '0.5rem', color: 'white' }} />
              </div>
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                Infinity Trade Mineral
              </h1>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#fbbf24',
                margin: 0,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Premium Mining Enterprise
              </p>
            </div>
          </div>
          
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, transparent 100%)',
            borderRadius: '1px'
          }} />
        </div>

        {/* Main Heading */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Industrial Excellence
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Redefined
            </span>
          </h2>
          <p style={{
            fontSize: '1.25rem',
            lineHeight: '1.7',
            color: '#cbd5e1',
            maxWidth: '500px',
            fontWeight: '400'
          }}>
            Next-generation enterprise platform for premium mineral trading operations. 
            Engineered for industry leaders who demand excellence.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '500px'
        }}>
          {[
            { icon: Mountain, title: 'Mining Operations', desc: 'Advanced Resource Management' },
            { icon: Truck, title: 'Supply Chain', desc: 'Intelligent Logistics Control' },
            { icon: Building2, title: 'Enterprise Suite', desc: 'Comprehensive Business Intelligence' },
            { icon: Shield, title: 'Security First', desc: 'Military-Grade Data Protection' }
          ].map((feature, index) => (
            <div key={index} style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.transform = 'translateY(0px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <feature.icon style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    color: '#fbbf24' 
                  }} />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: 0
                }}>
                  {feature.title}
                </h3>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px'
        }}>
          
          {/* Mobile Logo */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }} className="lg:hidden">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Gem style={{ width: '1.5rem', height: '1.5rem', color: '#fbbf24' }} />
              <div>
                <h1 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: 0
                }}>
                  Infinity Trade Mineral
                </h1>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  margin: 0
                }}>
                  PREMIUM ENTERPRISE
                </p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            
            {/* Card Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)
                `
              }} />
              
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 15px 30px rgba(245, 158, 11, 0.4)'
                }}>
                  <Building2 style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }} />
                </div>
                
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '-0.025em'
                }}>
                  Secure Access Portal
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#cbd5e1',
                  margin: 0
                }}>
                  Enter your credentials to access the management system
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '2rem' }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  {error && (
                    <Alert variant="destructive" style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.75rem'
                    }}>
                      <AlertDescription style={{ color: '#dc2626' }}>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div style={{ position: 'relative' }}>
                            <Mail style={{
                              position: 'absolute',
                              left: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '1.25rem',
                              height: '1.25rem',
                              color: '#9ca3af'
                            }} />
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@company.com"
                              disabled={isLoading}
                              autoComplete="email"
                              style={{
                                height: '3rem',
                                paddingLeft: '3rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#f59e0b'
                                e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb'
                                e.target.style.boxShadow = 'none'
                              }}
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
                        <FormLabel style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Password
                        </FormLabel>
                        <FormControl>
                          <div style={{ position: 'relative' }}>
                            <Lock style={{
                              position: 'absolute',
                              left: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '1.25rem',
                              height: '1.25rem',
                              color: '#9ca3af'
                            }} />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your secure password"
                              disabled={isLoading}
                              autoComplete="current-password"
                              style={{
                                height: '3rem',
                                paddingLeft: '3rem',
                                paddingRight: '3rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#f59e0b'
                                e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb'
                                e.target.style.boxShadow = 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                              {showPassword ? 
                                <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : 
                                <Eye style={{ width: '1.25rem', height: '1.25rem' }} />
                              }
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remember Me & Forgot Password */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem'
                  }}>
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              style={{
                                width: '1rem',
                                height: '1rem'
                              }}
                            />
                          </FormControl>
                          <FormLabel style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontWeight: '400',
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
                        fontWeight: '500',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#92400e'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#d97706'}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #d97706 0%, #92400e 100%)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(245, 158, 11, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        e.currentTarget.style.transform = 'translateY(0px)'
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(245, 158, 11, 0.3)'
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Access Management Portal
                        <ArrowRight style={{ width: '1.25rem', height: '1.25rem' }} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Additional Links */}
              <div style={{
                marginTop: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0
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
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
              marginBottom: '1rem'
            }} />
            <p style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              margin: '0 0 0.25rem 0',
              fontWeight: '500'
            }}>
              © 2024 Infinity Trade Mineral – Internal Use Only
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#64748b',
              margin: 0
            }}>
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
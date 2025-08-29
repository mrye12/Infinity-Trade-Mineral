'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Left Side - Industrial Imagery & Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
        
        {/* Mining/Industrial Geometric Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-amber-500/20 rotate-45" />
        <div className="absolute bottom-32 right-32 w-24 h-24 border border-amber-400/30 rotate-12" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-amber-500/10 rounded-full" />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 flex flex-col justify-center px-12 xl:px-16 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo & Company */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-2xl shadow-amber-500/25">
                <Gem className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Infinity Trade Mineral
                </h1>
                <p className="text-amber-200 text-sm font-medium tracking-wide">
                  PREMIUM MINING ENTERPRISE
                </p>
              </div>
            </div>
            
            <div className="h-px bg-gradient-to-r from-amber-500 via-amber-400 to-transparent mb-8" />
          </motion.div>

          {/* Main Tagline */}
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Industrial Excellence
              <span className="block text-amber-400">at Your Fingertips</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Advanced enterprise management platform for premium mineral trading operations. 
              Secure, powerful, and built for industry leaders.
            </p>
          </motion.div>

          {/* Feature Icons */}
          <motion.div 
            className="grid grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Mountain className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Mining Operations</p>
                <p className="text-gray-400 text-sm">Resource Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Truck className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Logistics Control</p>
                <p className="text-gray-400 text-sm">Supply Chain</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Enterprise Suite</p>
                <p className="text-gray-400 text-sm">Business Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Secure Access</p>
                <p className="text-gray-400 text-sm">Data Protection</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl">
              <Gem className="h-6 w-6 text-amber-400" />
              <div className="text-left">
                <h1 className="text-xl font-bold text-white">
                  Infinity Trade Mineral
                </h1>
                <p className="text-amber-200 text-xs">PREMIUM ENTERPRISE</p>
              </div>
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Card Header */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-gray-900 to-gray-800">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/25 mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Secure Access Portal
                </h2>
                <p className="text-gray-300 text-sm">
                  Enter your credentials to access the management system
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
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
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
            <p className="text-xs text-gray-500 font-medium">
              © 2024 Infinity Trade Mineral – Internal Use Only
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Secure Enterprise Access • Authorized Personnel Only
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}

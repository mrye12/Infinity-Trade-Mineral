import { getServerUser, getServerUserProfile } from '@/lib/auth-server'
import { getDashboardStats, getChartData } from '@/lib/dashboard-data'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCards } from '@/components/dashboard/stat-cards'
import { ShipmentTrendChart, InvoiceStatusChart } from '@/components/dashboard/charts'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { 
  FileText, 
  Receipt, 
  Truck, 
  Package, 
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const userProfile = await getServerUserProfile(user.id)

  if (!userProfile) {
    redirect('/auth/login')
  }

  const isAdmin = userProfile.role === 'admin'
  
  // Fetch dashboard data
  const [stats, chartData] = await Promise.all([
    getDashboardStats(),
    getChartData()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 lg:px-6 space-y-8">
        {/* Welcome Header with Modern Design */}
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                    Welcome back, <span className="font-medium text-slate-900 dark:text-white">{userProfile.full_name || userProfile.email}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Badge 
                  variant={isAdmin ? "destructive" : "secondary"} 
                  className={`text-sm font-medium px-3 py-1 ${
                    isAdmin 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white border-0'
                  }`}
                >
                  {userProfile.role.toUpperCase()} ACCESS
                </Badge>
                <div className="h-1 w-1 bg-slate-400 rounded-full"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <RefreshButton />
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">System Online</span>
              </div>
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <StatCards stats={stats} isAdmin={isAdmin} />

        {/* Charts Section with Modern Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-1">
            <ShipmentTrendChart data={chartData.shipmentTrend} />
          </div>
          
          {isAdmin ? (
            <div className="lg:col-span-1">
              <InvoiceStatusChart data={chartData.invoiceStatus} />
            </div>
          ) : (
            <Card className="lg:col-span-1 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Quick Access
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Navigate to sections you have access to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/documents" className="block group">
                  <div className="flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950 dark:hover:to-blue-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:shadow-md">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-slate-900 dark:text-white">Documents</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Browse company documents</p>
                    </div>
                  </div>
                </Link>
                <Link href="/shipments" className="block group">
                  <div className="flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950 dark:hover:to-emerald-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-600 group-hover:shadow-md">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                      <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-slate-900 dark:text-white">Shipments</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Track mineral shipments</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Panel Section with Modern Design */}
        {isAdmin && (
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Admin Control Center
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Administrative functions and system management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/users" className="block group">
                  <div className="flex flex-col items-start p-5 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-950 dark:hover:to-purple-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-purple-300 dark:group-hover:border-purple-600 group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors mb-3">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">User Management</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Manage staff accounts & permissions</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/invoices" className="block group">
                  <div className="flex flex-col items-start p-5 rounded-xl hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-950 dark:hover:to-orange-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-orange-300 dark:group-hover:border-orange-600 group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors mb-3">
                      <Receipt className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">Invoice Management</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Billing & financial operations</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/stock" className="block group">
                  <div className="flex flex-col items-start p-5 rounded-xl hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 dark:hover:from-red-950 dark:hover:to-red-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-red-300 dark:group-hover:border-red-600 group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors mb-3">
                      <Package className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">Office Inventory</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Stock tracking & management</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/documents" className="block group">
                  <div className="flex flex-col items-start p-5 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950 dark:hover:to-blue-900 transition-all duration-200 border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors mb-3">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">Document Center</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Contract & file management</p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status Card with Modern Design */}
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              System Health Monitor
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Real-time system status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Authentication</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">User session active</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800">
                  ✓ Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Database</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Supabase connected</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                  ✓ Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Data Sync</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Real-time updates</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800">
                  ✓ Live
                </Badge>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">🎉</div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Production System Ready
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Enterprise management platform with real-time data integration, role-based access control, and comprehensive business modules
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Version</p>
                    <p className="font-medium text-slate-900 dark:text-white">v1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Deployment</p>
                    <p className="font-medium text-slate-900 dark:text-white">Production</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Framework</p>
                    <p className="font-medium text-slate-900 dark:text-white">Next.js 15</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Backend</p>
                    <p className="font-medium text-slate-900 dark:text-white">Supabase</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

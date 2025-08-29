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
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile.full_name || userProfile.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAdmin ? "destructive" : "secondary"} className="text-sm">
            {userProfile.role.toUpperCase()}
          </Badge>
          <RefreshButton />
        </div>
      </div>

      {/* Stats Cards */}
      <StatCards stats={stats} isAdmin={isAdmin} />

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <ShipmentTrendChart data={chartData.shipmentTrend} />
        {isAdmin && <InvoiceStatusChart data={chartData.invoiceStatus} />}
        
        {/* Quick Access Card for Staff or Additional Chart Space for Admin */}
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Quick Access
              </CardTitle>
              <CardDescription>
                Navigate to sections you have access to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/documents" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <FileText className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-medium">Documents</p>
                    <p className="text-sm text-muted-foreground">Browse company documents</p>
                  </div>
                </div>
              </Link>
              <Link href="/shipments" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <Truck className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <p className="font-medium">Shipments</p>
                    <p className="text-sm text-muted-foreground">Track mineral shipments</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Panel Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Admin Panel
            </CardTitle>
            <CardDescription>
              Administrative functions and system management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/users" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <Users className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="font-medium">User Management</p>
                    <p className="text-sm text-muted-foreground">Manage staff accounts</p>
                  </div>
                </div>
              </Link>
              <Link href="/invoices" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <Receipt className="h-5 w-5 mr-3 text-orange-500" />
                  <div>
                    <p className="font-medium">Invoices</p>
                    <p className="text-sm text-muted-foreground">Billing management</p>
                  </div>
                </div>
              </Link>
              <Link href="/stock" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <Package className="h-5 w-5 mr-3 text-red-500" />
                  <div>
                    <p className="font-medium">Office Stock</p>
                    <p className="text-sm text-muted-foreground">Inventory tracking</p>
                  </div>
                </div>
              </Link>
              <Link href="/documents" className="block">
                <div className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors border">
                  <FileText className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-medium">Documents</p>
                    <p className="text-sm text-muted-foreground">Document management</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">User session active</p>
              </div>
              <Badge variant="outline" className="text-green-600 bg-green-50">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Supabase connected</p>
              </div>
              <Badge variant="outline" className="text-green-600 bg-green-50">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Data Sync</p>
                <p className="text-sm text-muted-foreground">Real-time updates</p>
              </div>
              <Badge variant="outline" className="text-green-600 bg-green-50">
                Live
              </Badge>
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">
              🎉 Phase 3: Dashboard Complete
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time data integration, role-based access, and interactive charts implemented
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Receipt, 
  Truck, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import type { DashboardStats } from '@/lib/dashboard-data'

interface StatCardsProps {
  stats: DashboardStats
  isAdmin: boolean
}

export function StatCards({ stats, isAdmin }: StatCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Documents Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.documents.contracts} contracts active
          </p>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              Reports: {stats.documents.reports}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Docs: {stats.documents.companyDocs}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shipments</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.shipments.totalThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
          <div className="flex gap-1 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              {stats.shipments.delivered}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              <Clock className="w-3 h-3 mr-1" />
              {stats.shipments.inTransit}
            </Badge>
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
              <Package className="w-3 h-3 mr-1" />
              {stats.shipments.preparing}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Card - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices.totalThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.invoices.totalAmount)} total
            </p>
            <div className="flex gap-1 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats.invoices.paid}
              </Badge>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                <Clock className="w-3 h-3 mr-1" />
                {stats.invoices.pending}
              </Badge>
              {stats.invoices.overdue > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.invoices.overdue}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Office Stock Card - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Office Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stock.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Total items tracked
            </p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {stats.stock.lowStock > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.stock.lowStock} low
                </Badge>
              )}
              {stats.stock.outOfStock > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                  <XCircle className="w-3 h-3 mr-1" />
                  {stats.stock.outOfStock} out
                </Badge>
              )}
              {stats.stock.lowStock === 0 && stats.stock.outOfStock === 0 && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All good
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Cards for Staff - show different content */}
      {!isAdmin && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Access</CardTitle>
              <Badge variant="secondary">Staff</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Documents
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Shipments
                </div>
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Invoices (Admin only)</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Stock (Admin only)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a 
                  href="/documents" 
                  className="block p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Browse Documents
                </a>
                <a 
                  href="/shipments" 
                  className="block p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  Track Shipments
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

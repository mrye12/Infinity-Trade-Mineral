'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/auth'
import { getInvoices, deleteInvoice, updateInvoiceStatus } from '@/lib/invoice-service'
import type { Invoice, User } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null
  })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  const router = useRouter()

  useEffect(() => {
    async function loadUserAndInvoices() {
      try {
        const { user: authUser } = await getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        setUser(authUser)
        const profile = await getUserProfile(authUser.id)
        
        if (!profile || profile.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setUserProfile(profile)
        
        // Load invoices
        await loadInvoices()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndInvoices()
  }, [router])

  const loadInvoices = async () => {
    try {
      const data = await getInvoices({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        customer: searchTerm || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
      })
      setInvoices(data)
      setFilteredInvoices(data)
    } catch (error) {
      console.error('Error loading invoices:', error)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = invoices

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateFromFilter) {
      filtered = filtered.filter(inv => inv.issue_date >= dateFromFilter)
    }

    if (dateToFilter) {
      filtered = filtered.filter(inv => inv.issue_date <= dateToFilter)
    }

    setFilteredInvoices(filtered)
  }, [invoices, statusFilter, searchTerm, dateFromFilter, dateToFilter])

  const handleDelete = async (invoice: Invoice) => {
    setDeleteDialog({ open: true, invoice })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.invoice) return

    setDeleting(deleteDialog.invoice.id)
    try {
      await deleteInvoice(deleteDialog.invoice.id)
      await loadInvoices()
      setDeleteDialog({ open: false, invoice: null })
    } catch (error) {
      console.error('Error deleting invoice:', error)
    } finally {
      setDeleting(null)
    }
  }

  const togglePaidStatus = async (invoice: Invoice) => {
    setStatusUpdating(invoice.id)
    try {
      const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid'
      await updateInvoiceStatus(invoice.id, newStatus)
      await loadInvoices()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setStatusUpdating(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'unpaid':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge variant="outline" className={`${variants[status as keyof typeof variants]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Customer or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Total: {filteredInvoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No invoices found</p>
              <Link href="/invoices/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.customer_name}</p>
                        {invoice.customer_email && (
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer_email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issue_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/invoices/${invoice.id}?edit=true`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaidStatus(invoice)}
                          disabled={statusUpdating === invoice.id}
                          className={invoice.status === 'paid' ? 'text-red-600' : 'text-green-600'}
                        >
                          {statusUpdating === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : invoice.status === 'paid' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(invoice)}
                          disabled={deleting === invoice.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deleting === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, invoice: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {deleteDialog.invoice?.invoice_number}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, invoice: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

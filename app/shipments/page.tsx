'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/auth'
import { getShipments, deleteShipment, updateShipmentStatus } from '@/lib/shipment-service'
import type { Shipment, User } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Ship,
  Calendar,
  Package,
  FileText,
  Loader2,
  Play,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; shipment: Shipment | null }>({
    open: false,
    shipment: null
  })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [vesselSearch, setVesselSearch] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  const router = useRouter()

  useEffect(() => {
    async function loadUserAndShipments() {
      try {
        const { user: authUser } = await getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        setUser(authUser)
        const profile = await getUserProfile(authUser.id)
        
        if (!profile) {
          router.push('/auth/login')
          return
        }

        setUserProfile(profile)
        
        // Load shipments
        await loadShipments()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndShipments()
  }, [router])

  const loadShipments = async () => {
    try {
      const data = await getShipments({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vessel: vesselSearch || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
      })
      setShipments(data)
      setFilteredShipments(data)
    } catch (error) {
      console.error('Error loading shipments:', error)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = shipments

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter)
    }

    if (vesselSearch) {
      filtered = filtered.filter(shipment => 
        shipment.vessel_name.toLowerCase().includes(vesselSearch.toLowerCase()) ||
        shipment.shipment_code.toLowerCase().includes(vesselSearch.toLowerCase())
      )
    }

    if (dateFromFilter) {
      filtered = filtered.filter(shipment => shipment.departure_date >= dateFromFilter)
    }

    if (dateToFilter) {
      filtered = filtered.filter(shipment => shipment.departure_date <= dateToFilter)
    }

    setFilteredShipments(filtered)
  }, [shipments, statusFilter, vesselSearch, dateFromFilter, dateToFilter])

  const handleDelete = async (shipment: Shipment) => {
    if (userProfile?.role !== 'admin') return
    setDeleteDialog({ open: true, shipment })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.shipment || userProfile?.role !== 'admin') return

    setDeleting(deleteDialog.shipment.id)
    try {
      await deleteShipment(deleteDialog.shipment.id)
      await loadShipments()
      setDeleteDialog({ open: false, shipment: null })
    } catch (error) {
      console.error('Error deleting shipment:', error)
    } finally {
      setDeleting(null)
    }
  }

  const advanceStatus = async (shipment: Shipment) => {
    const statusFlow = {
      'Scheduled': 'On Transit',
      'On Transit': 'Arrived',
      'Arrived': 'Completed'
    }
    
    const nextStatus = statusFlow[shipment.status as keyof typeof statusFlow]
    if (!nextStatus) return

    setStatusUpdating(shipment.id)
    try {
      await updateShipmentStatus(shipment.id, nextStatus as any)
      await loadShipments()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setStatusUpdating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'On Transit':
        return <Ship className="h-4 w-4 text-orange-500" />
      case 'Arrived':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'On Transit': 'bg-orange-100 text-orange-800',
      'Arrived': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge variant="outline" className={`${variants[status as keyof typeof variants]} border-0`}>
        {status}
      </Badge>
    )
  }

  const canAdvanceStatus = (status: string) => {
    return status !== 'Completed'
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
          <Truck className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
        </div>
        <Link href="/shipments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Shipment
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
                  placeholder="Vessel or shipment code..."
                  value={vesselSearch}
                  onChange={(e) => setVesselSearch(e.target.value)}
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
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="On Transit">On Transit</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
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

      {/* Shipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment List</CardTitle>
          <CardDescription>
            Total: {filteredShipments.length} shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No shipments found</p>
              <Link href="/shipments/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Shipment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment Code</TableHead>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.shipment_code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Ship className="h-4 w-4 mr-2 text-blue-500" />
                        {shipment.vessel_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{shipment.departure_port}</div>
                        <div className="text-muted-foreground flex items-center">
                          <ArrowRight className="h-3 w-3 mx-1" />
                          {shipment.arrival_port}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(shipment.departure_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1 text-gray-500" />
                        {shipment.quantity} tons
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(shipment.status)}
                        {getStatusBadge(shipment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(shipment as any).invoice ? (
                        <div className="text-sm">
                          <div className="font-medium">{(shipment as any).invoice.invoice_number}</div>
                          <div className="text-muted-foreground">{(shipment as any).invoice.customer_name}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No invoice</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/shipments/${shipment.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/shipments/${shipment.id}?edit=true`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canAdvanceStatus(shipment.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => advanceStatus(shipment)}
                            disabled={statusUpdating === shipment.id}
                            className="text-green-600"
                          >
                            {statusUpdating === shipment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {userProfile?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shipment)}
                            disabled={deleting === shipment.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === shipment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, shipment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete shipment {deleteDialog.shipment?.shipment_code}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, shipment: null })}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/auth'
import { 
  getStockItems, 
  deleteStockItem, 
  getStockLocations,
  getStockStatusBadge,
  isLowStock,
  CATEGORY_LABELS 
} from '@/lib/stock-service'
import type { StockOffice, User } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  TrendingDown,
  MapPin,
  Tag,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockOffice[]>([])
  const [filteredItems, setFilteredItems] = useState<StockOffice[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: StockOffice | null }>({
    open: false,
    item: null
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [stockStatusFilter, setStockStatusFilter] = useState('all') // all, low_stock, out_of_stock, normal

  const router = useRouter()

  useEffect(() => {
    async function loadData() {
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
        
        // Load stock items and locations
        await Promise.all([
          loadStockItems(),
          loadLocations()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load stock data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadStockItems = async () => {
    try {
      const data = await getStockItems()
      setStockItems(data)
    } catch (error) {
      console.error('Error loading stock items:', error)
      setError('Failed to load stock items')
    }
  }

  const loadLocations = async () => {
    try {
      const data = await getStockLocations()
      setLocations(data)
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = stockItems

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.location === locationFilter)
    }

    // Stock status filter
    if (stockStatusFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (stockStatusFilter === 'low_stock') {
          return item.current_stock <= item.min_stock && item.current_stock > 0
        }
        if (stockStatusFilter === 'out_of_stock') {
          return item.current_stock === 0
        }
        if (stockStatusFilter === 'normal') {
          return item.current_stock > item.min_stock
        }
        return true
      })
    }

    setFilteredItems(filtered)
  }, [stockItems, searchTerm, categoryFilter, locationFilter, stockStatusFilter])

  const handleDelete = async (item: StockOffice) => {
    if (userProfile?.role !== 'admin') return
    setDeleteDialog({ open: true, item })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.item || userProfile?.role !== 'admin') return

    setDeleting(deleteDialog.item.id)
    try {
      await deleteStockItem(deleteDialog.item.id)
      await loadStockItems()
      setDeleteDialog({ open: false, item: null })
    } catch (error) {
      console.error('Error deleting stock item:', error)
      setError('Failed to delete stock item')
    } finally {
      setDeleting(null)
    }
  }

  const getStockRowClassName = (item: StockOffice) => {
    if (item.current_stock === 0) {
      return 'bg-red-50 border-l-4 border-l-red-500'
    }
    if (isLowStock(item)) {
      return 'bg-yellow-50 border-l-4 border-l-yellow-500'
    }
    return ''
  }

  const lowStockCount = stockItems.filter(isLowStock).length
  const outOfStockCount = stockItems.filter(item => item.current_stock === 0).length

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
          <Package className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Office Stock</h1>
        </div>
        <Link href="/stock/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Stock Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="space-y-2">
          {outOfStockCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{outOfStockCount}</strong> item{outOfStockCount !== 1 ? 's' : ''} out of stock
              </AlertDescription>
            </Alert>
          )}
          {lowStockCount > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>{lowStockCount}</strong> item{lowStockCount !== 1 ? 's' : ''} running low on stock
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(CATEGORY_LABELS).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Status</label>
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="normal">Normal Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setLocationFilter('all')
                  setStockStatusFilter('all')
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Items</CardTitle>
          <CardDescription>
            Total: {filteredItems.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No stock items found</p>
              <Link href="/stock/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const statusBadge = getStockStatusBadge(item)
                  return (
                    <TableRow key={item.id} className={getStockRowClassName(item)}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.item_name}</div>
                          {item.notes && (
                            <div className="text-sm text-muted-foreground">{item.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1 text-gray-500" />
                          {CATEGORY_LABELS[item.category]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.current_stock} {item.unit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {item.min_stock} {item.unit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                          {item.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/stock/${item.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/stock/${item.id}?edit=true`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {userProfile?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              disabled={deleting === item.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deleting === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.item?.item_name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, item: null })}
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
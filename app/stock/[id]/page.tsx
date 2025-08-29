'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { 
  getStockItem, 
  updateStockItem, 
  updateStockQuantity,
  adjustStock,
  deleteStockItem,
  getStockStatusBadge,
  isLowStock,
  CATEGORY_LABELS,
  COMMON_UNITS,
  COMMON_LOCATIONS
} from '@/lib/stock-service'
import type { User, StockOffice } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Package, 
  Edit, 
  Save, 
  ArrowLeft, 
  Trash2,
  Plus,
  Minus,
  Calculator,
  Tag,
  MapPin,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

// Form validation schemas
const editStockSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category: z.enum(['office_supplies', 'equipment', 'consumables']),
  min_stock: z.number().min(0, 'Minimum stock must be 0 or greater'),
  unit: z.string().min(1, 'Unit is required'),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
})

const adjustmentSchema = z.object({
  adjustment: z.number().int('Must be a whole number'),
  reason: z.string().min(1, 'Reason is required'),
})

const setQuantitySchema = z.object({
  new_quantity: z.number().min(0, 'Quantity must be 0 or greater').int('Must be a whole number'),
  reason: z.string().min(1, 'Reason is required'),
})

type EditStockFormData = z.infer<typeof editStockSchema>
type AdjustmentFormData = z.infer<typeof adjustmentSchema>
type SetQuantityFormData = z.infer<typeof setQuantitySchema>

interface StockDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const [stockItem, setStockItem] = useState<StockOffice | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adjustingStock, setAdjustingStock] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [adjustmentDialog, setAdjustmentDialog] = useState(false)
  const [setQuantityDialog, setSetQuantityDialog] = useState(false)
  
  // Edit mode
  const searchParams = useSearchParams()
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true')

  const router = useRouter()

  const editForm = useForm<EditStockFormData>({
    resolver: zodResolver(editStockSchema),
    defaultValues: {
      item_name: '',
      category: 'office_supplies',
      min_stock: 0,
      unit: 'pcs',
      location: '',
      notes: '',
    },
  })

  const adjustmentForm = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment: 0,
      reason: '',
    },
  })

  const setQuantityForm = useForm<SetQuantityFormData>({
    resolver: zodResolver(setQuantitySchema),
    defaultValues: {
      new_quantity: 0,
      reason: '',
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        // Resolve params promise
        const resolvedParams = await params
        
        // Load user
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

        // Load stock item
        const stockData = await getStockItem(resolvedParams.id)
        
        if (!stockData) {
          setError('Stock item not found')
          return
        }

        setStockItem(stockData)

        // Set form values for edit mode
        if (isEditMode) {
          editForm.reset({
            item_name: stockData.item_name,
            category: stockData.category,
            min_stock: stockData.min_stock,
            unit: stockData.unit,
            location: stockData.location,
            notes: stockData.notes || '',
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load stock item')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, isEditMode, editForm])

  const toggleEditMode = () => {
    if (isEditMode && stockItem) {
      // Reset form when canceling edit
      editForm.reset({
        item_name: stockItem.item_name,
        category: stockItem.category,
        min_stock: stockItem.min_stock,
        unit: stockItem.unit,
        location: stockItem.location,
        notes: stockItem.notes || '',
      })
    }
    setIsEditMode(!isEditMode)
  }

  const onEditSubmit = async (data: EditStockFormData) => {
    if (!stockItem || !user) return

    setSaving(true)
    setError(null)

    try {
      const updatedItem = await updateStockItem(stockItem.id, {
        item_name: data.item_name,
        category: data.category,
        min_stock: data.min_stock,
        unit: data.unit,
        location: data.location,
        notes: data.notes || undefined,
      }, user.id)
      
      setStockItem(updatedItem)
      setIsEditMode(false)
    } catch (err) {
      console.error('Error updating stock item:', err)
      setError('Failed to update stock item')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustment = async (data: AdjustmentFormData) => {
    if (!stockItem || !user) return

    setAdjustingStock(true)
    try {
      const updatedItem = await adjustStock(stockItem.id, data.adjustment, user.id, data.reason)
      setStockItem(updatedItem)
      setAdjustmentDialog(false)
      adjustmentForm.reset()
    } catch (error) {
      console.error('Error adjusting stock:', error)
      setError('Failed to adjust stock')
    } finally {
      setAdjustingStock(false)
    }
  }

  const handleSetQuantity = async (data: SetQuantityFormData) => {
    if (!stockItem || !user) return

    setAdjustingStock(true)
    try {
      const updatedItem = await updateStockQuantity(stockItem.id, data.new_quantity, user.id, data.reason)
      setStockItem(updatedItem)
      setSetQuantityDialog(false)
      setQuantityForm.reset()
    } catch (error) {
      console.error('Error setting quantity:', error)
      setError('Failed to set quantity')
    } finally {
      setAdjustingStock(false)
    }
  }

  const handleDelete = async () => {
    if (!stockItem || userProfile?.role !== 'admin') return

    setDeleting(true)
    try {
      await deleteStockItem(stockItem.id)
      router.push('/stock')
    } catch (error) {
      console.error('Error deleting stock item:', error)
      setError('Failed to delete stock item')
    } finally {
      setDeleting(false)
      setDeleteDialog(false)
    }
  }

  const openAdjustmentDialog = (defaultAdjustment = 0) => {
    adjustmentForm.reset({
      adjustment: defaultAdjustment,
      reason: defaultAdjustment > 0 ? 'Stock in' : defaultAdjustment < 0 ? 'Stock out' : '',
    })
    setAdjustmentDialog(true)
  }

  const openSetQuantityDialog = () => {
    if (stockItem) {
      setQuantityForm.reset({
        new_quantity: stockItem.current_stock,
        reason: 'Manual stock adjustment',
      })
    }
    setSetQuantityDialog(true)
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

  if (error && !stockItem) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!stockItem) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Stock item not found</p>
            <Link href="/stock">
              <Button className="mt-4">Back to Stock</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusBadge = getStockStatusBadge(stockItem)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {stockItem.item_name}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
              <span className="text-muted-foreground">
                {CATEGORY_LABELS[stockItem.category]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={toggleEditMode}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? 'Cancel Edit' : 'Edit'}
          </Button>
          {userProfile?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Link href="/stock">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Low Stock Warning */}
      {isLowStock(stockItem) && (
        <Alert variant={stockItem.current_stock === 0 ? 'destructive' : 'default'} 
               className={stockItem.current_stock === 0 ? '' : 'border-yellow-200 bg-yellow-50'}>
          <AlertTriangle className={`h-4 w-4 ${stockItem.current_stock === 0 ? 'text-red-600' : 'text-yellow-600'}`} />
          <AlertDescription className={stockItem.current_stock === 0 ? 'text-red-800' : 'text-yellow-800'}>
            {stockItem.current_stock === 0 
              ? 'This item is out of stock!'
              : 'This item is running low on stock. Consider restocking soon.'
            }
          </AlertDescription>
        </Alert>
      )}

      {isEditMode ? (
        // Edit Mode
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
            {/* Edit Form */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Stock Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="item_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMON_LOCATIONS.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="min_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stock *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMON_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={toggleEditMode}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        // View Mode
        <div className="space-y-6">
          {/* Stock Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {stockItem.current_stock}
                  </div>
                  <div className="text-muted-foreground">
                    {stockItem.unit}
                  </div>
                  <div className="mt-4 flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAdjustmentDialog(-1)}
                      className="text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openSetQuantityDialog}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAdjustmentDialog(1)}
                      className="text-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Minimum Stock</Label>
                  <p className="font-medium">
                    {stockItem.min_stock} {stockItem.unit}
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="font-medium flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-500" />
                    {CATEGORY_LABELS[stockItem.category]}
                  </p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    {stockItem.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stockItem.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-muted-foreground">{stockItem.notes}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(stockItem.updated_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <Label>Updated By</Label>
                  <p className="text-muted-foreground flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {(stockItem as any).last_updated_user?.full_name || 'System'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  onClick={() => openAdjustmentDialog(10)}
                  className="flex items-center justify-center"
                >
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                  Stock In (+10)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => openAdjustmentDialog(-1)}
                  className="flex items-center justify-center"
                >
                  <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                  Stock Out (-1)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={openSetQuantityDialog}
                  className="flex items-center justify-center"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Set Quantity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Add or subtract stock quantity for {stockItem.item_name}
            </DialogDescription>
          </DialogHeader>
          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit(handleAdjustment)} className="space-y-4">
              <FormField
                control={adjustmentForm.control}
                name="adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment (+ for stock in, - for stock out)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustmentForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New delivery, Used in office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAdjustmentDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adjustingStock}>
                  {adjustingStock ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    'Apply Adjustment'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Set Quantity Dialog */}
      <Dialog open={setQuantityDialog} onOpenChange={setSetQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Stock Quantity</DialogTitle>
            <DialogDescription>
              Set exact stock quantity for {stockItem.item_name}
            </DialogDescription>
          </DialogHeader>
          <Form {...setQuantityForm}>
            <form onSubmit={setQuantityForm.handleSubmit(handleSetQuantity)} className="space-y-4">
              <FormField
                control={setQuantityForm.control}
                name="new_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={setQuantityForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Physical count, Inventory correction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSetQuantityDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adjustingStock}>
                  {adjustingStock ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set Quantity'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{stockItem.item_name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
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

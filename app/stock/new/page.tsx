'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { createStockItem, CATEGORY_LABELS, COMMON_UNITS, COMMON_LOCATIONS } from '@/lib/stock-service'
import type { User } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  ArrowLeft,
  Save,
  Tag,
  MapPin,
  Calculator,
  AlertTriangle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const newStockSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category: z.enum(['office_supplies', 'equipment', 'consumables'], {
    message: 'Please select a category'
  }),
  current_stock: z.number().min(0, 'Current stock must be 0 or greater'),
  min_stock: z.number().min(0, 'Minimum stock must be 0 or greater'),
  unit: z.string().min(1, 'Unit is required'),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
})

type NewStockFormData = z.infer<typeof newStockSchema>

export default function NewStockPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const form = useForm<NewStockFormData>({
    resolver: zodResolver(newStockSchema),
    defaultValues: {
      item_name: '',
      category: 'office_supplies',
      current_stock: 0,
      min_stock: 0,
      unit: 'pcs',
      location: '',
      notes: '',
    },
  })

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
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const onSubmit = async (data: NewStockFormData) => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      await createStockItem({
        item_name: data.item_name,
        category: data.category,
        current_stock: data.current_stock,
        min_stock: data.min_stock,
        unit: data.unit,
        location: data.location,
        notes: data.notes || undefined,
      }, user.id)

      router.push('/stock')
    } catch (err) {
      console.error('Error creating stock item:', err)
      setError('Failed to create stock item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Watch current stock and min stock for low stock warning
  const currentStock = form.watch('current_stock')
  const minStock = form.watch('min_stock')
  const isLowStock = currentStock <= minStock && currentStock > 0
  const isOutOfStock = currentStock === 0

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
          <h1 className="text-3xl font-bold tracking-tight">Add New Stock Item</h1>
        </div>
        <Link href="/stock">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stock
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stock Status Warning */}
      {(isLowStock || isOutOfStock) && (
        <Alert variant={isOutOfStock ? 'destructive' : 'default'} className={isOutOfStock ? '' : 'border-yellow-200 bg-yellow-50'}>
          <AlertTriangle className={`h-4 w-4 ${isOutOfStock ? 'text-red-600' : 'text-yellow-600'}`} />
          <AlertDescription className={isOutOfStock ? 'text-red-800' : 'text-yellow-800'}>
            {isOutOfStock 
              ? 'Warning: This item will be marked as out of stock'
              : 'Warning: This item will be marked as low stock (current stock ≤ minimum stock)'
            }
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details for the stock item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., A4 Paper, Toner Cartridge, Wireless Mouse" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes, specifications, or description..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Stock Quantities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Stock Quantities
              </CardTitle>
              <CardDescription>
                Set current stock levels and minimum thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="current_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="1"
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
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="1"
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
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
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

              {/* Stock Status Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Stock Status Preview</Label>
                <div className="mt-2 flex items-center space-x-2">
                  {isOutOfStock ? (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Out of Stock</span>
                    </div>
                  ) : isLowStock ? (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Low Stock</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <Package className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Normal Stock</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Storage Location
              </CardTitle>
              <CardDescription>
                Specify where this item is stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage location" />
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/stock">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Stock Item
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { createInvoice, calculateInvoiceTotals, calculateItemTotal } from '@/lib/invoice-service'
import type { User, InvoiceItem } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Calculator,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be 0 or greater'),
  total: z.number().min(0, 'Total must be 0 or greater'),
})

const newInvoiceSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax_percent: z.number().min(0).max(100, 'Tax percent must be between 0 and 100'),
  extra_fee: z.number().min(0, 'Extra fee must be 0 or greater'),
})

type NewInvoiceFormData = z.infer<typeof newInvoiceSchema>

export default function NewInvoicePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Calculations
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)

  const router = useRouter()

  // Get default dates
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const defaultDueDate = nextMonth.toISOString().split('T')[0]

  const form = useForm<NewInvoiceFormData>({
    resolver: zodResolver(newInvoiceSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      issue_date: today,
      due_date: defaultDueDate,
      items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      tax_percent: 11, // Default PPN 11% for Indonesia
      extra_fee: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    async function loadUser() {
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
      } catch (error) {
        console.error('Error loading user:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  // Watch form values for calculations
  const watchedItems = form.watch('items')
  const watchedTaxPercent = form.watch('tax_percent')
  const watchedExtraFee = form.watch('extra_fee')

  // Calculate totals whenever items, tax, or extra fee changes
  useEffect(() => {
    const validItems = watchedItems.filter(item => 
      item.description && item.quantity > 0 && item.unit_price >= 0
    )

    const calculations = calculateInvoiceTotals(
      validItems,
      watchedTaxPercent || 0,
      watchedExtraFee || 0
    )

    setSubtotal(calculations.subtotal)
    setTaxAmount(calculations.taxAmount)
    setTotal(calculations.total)
  }, [watchedItems, watchedTaxPercent, watchedExtraFee])

  // Update item total when quantity or unit price changes
  const updateItemTotal = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`)
    const unitPrice = form.getValues(`items.${index}.unit_price`)
    const total = calculateItemTotal(quantity, unitPrice)
    form.setValue(`items.${index}.total`, total)
  }

  const addItem = () => {
    append({ description: '', quantity: 1, unit_price: 0, total: 0 })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const onSubmit = async (data: NewInvoiceFormData) => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const invoiceData = {
        customer_name: data.customer_name,
        customer_email: data.customer_email || undefined,
        issue_date: data.issue_date,
        due_date: data.due_date,
        items: data.items,
        subtotal,
        tax_percent: data.tax_percent,
        extra_fee: data.extra_fee,
        total,
      }

      await createInvoice(invoiceData, user.id)
      router.push('/invoices')
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError('Failed to create invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
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
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
        </div>
        <Link href="/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Enter the customer details for this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter customer email (optional)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Dates</CardTitle>
              <CardDescription>
                Set the issue and due dates for this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invoice Items</span>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
              <CardDescription>
                Add products or services to this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Product or service description" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              placeholder="1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0)
                                updateItemTotal(index)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (IDR) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="1000"
                              min="0"
                              placeholder="100000"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0)
                                updateItemTotal(index)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="text-right">
                    <Label>Item Total: </Label>
                    <span className="text-lg font-semibold">
                      {formatCurrency(form.watch(`items.${index}.total`) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tax and Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Tax & Additional Fees
              </CardTitle>
              <CardDescription>
                Configure tax percentage and additional fees
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tax_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Percentage (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="11"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="extra_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Fee (IDR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="1000"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>
                Review the calculated totals before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {watchedTaxPercent > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({watchedTaxPercent}%):</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                {watchedExtraFee > 0 && (
                  <div className="flex justify-between">
                    <span>Extra Fee:</span>
                    <span className="font-medium">{formatCurrency(watchedExtraFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/invoices">
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
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

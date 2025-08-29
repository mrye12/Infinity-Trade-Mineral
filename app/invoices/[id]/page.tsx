'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { 
  getInvoice, 
  updateInvoice, 
  updateInvoiceStatus, 
  deleteInvoice,
  calculateInvoiceTotals,
  calculateItemTotal 
} from '@/lib/invoice-service'
import type { User, Invoice, InvoiceItem } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Receipt, 
  Edit, 
  Save, 
  ArrowLeft, 
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Calculator,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

// Form validation schema (same as new invoice)
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be 0 or greater'),
  total: z.number().min(0, 'Total must be 0 or greater'),
})

const editInvoiceSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax_percent: z.number().min(0).max(100, 'Tax percent must be between 0 and 100'),
  extra_fee: z.number().min(0, 'Extra fee must be 0 or greater'),
})

type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  
  // Edit mode
  const searchParams = useSearchParams()
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true')
  
  // Calculations for edit mode
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)

  const router = useRouter()

  const form = useForm<EditInvoiceFormData>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      issue_date: '',
      due_date: '',
      items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      tax_percent: 0,
      extra_fee: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
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
        
        if (!profile || profile.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setUserProfile(profile)

        // Load invoice
        const invoiceData = await getInvoice(resolvedParams.id)
        
        if (!invoiceData) {
          setError('Invoice not found')
          return
        }

        setInvoice(invoiceData)

        // Set form values for edit mode
        if (isEditMode) {
          form.reset({
            customer_name: invoiceData.customer_name,
            customer_email: invoiceData.customer_email || '',
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            items: invoiceData.items,
            tax_percent: invoiceData.tax_percent,
            extra_fee: invoiceData.extra_fee,
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, isEditMode, form])

  // Watch form values for calculations in edit mode
  const watchedItems = form.watch('items')
  const watchedTaxPercent = form.watch('tax_percent')
  const watchedExtraFee = form.watch('extra_fee')

  useEffect(() => {
    if (!isEditMode) return

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
  }, [watchedItems, watchedTaxPercent, watchedExtraFee, isEditMode])

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

  const toggleEditMode = () => {
    if (isEditMode) {
      // Reset form when canceling edit
      if (invoice) {
        form.reset({
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email || '',
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          items: invoice.items,
          tax_percent: invoice.tax_percent,
          extra_fee: invoice.extra_fee,
        })
      }
    }
    setIsEditMode(!isEditMode)
  }

  const onSubmit = async (data: EditInvoiceFormData) => {
    if (!invoice) return

    setSaving(true)
    setError(null)

    try {
      const updateData = {
        customer_name: data.customer_name,
        customer_email: data.customer_email || undefined,
        issue_date: data.issue_date,
        due_date: data.due_date,
        items: data.items,
        subtotal: isEditMode ? subtotal : invoice.subtotal,
        tax_percent: data.tax_percent,
        extra_fee: data.extra_fee,
        total: isEditMode ? total : invoice.total,
      }

      const updatedInvoice = await updateInvoice(invoice.id, updateData)
      setInvoice(updatedInvoice)
      setIsEditMode(false)
    } catch (err) {
      console.error('Error updating invoice:', err)
      setError('Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const togglePaidStatus = async () => {
    if (!invoice) return

    setStatusUpdating(true)
    try {
      const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid'
      const updatedInvoice = await updateInvoiceStatus(invoice.id, newStatus)
      setInvoice(updatedInvoice)
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update invoice status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return

    setDeleting(true)
    try {
      await deleteInvoice(invoice.id)
      router.push('/invoices')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      setError('Failed to delete invoice')
    } finally {
      setDeleting(false)
      setDeleteDialog(false)
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
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'unpaid':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
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

  if (error && !invoice) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Invoice not found</p>
            <Link href="/invoices">
              <Button className="mt-4">Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {invoice.invoice_number}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(invoice.status)}
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={togglePaidStatus}
            disabled={statusUpdating}
            className={invoice.status === 'paid' ? 'text-red-600' : 'text-green-600'}
          >
            {statusUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : invoice.status === 'paid' ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Mark Unpaid
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Paid
              </>
            )}
          </Button>
          <Button variant="outline" onClick={toggleEditMode}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? 'Cancel Edit' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialog(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Link href="/invoices">
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

      {isEditMode ? (
        // Edit Mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input type="email" {...field} />
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
                          className="text-red-600"
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
                                <Input {...field} />
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

            {/* Invoice Summary - Edit Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
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
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Customer Name</Label>
                <p className="font-medium">{invoice.customer_name}</p>
              </div>
              <div>
                <Label>Customer Email</Label>
                <p className="font-medium">{invoice.customer_email || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Issue Date</Label>
                <p className="font-medium">
                  {new Date(invoice.issue_date).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <Label>Due Date</Label>
                <p className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <p className="font-medium">{item.description}</p>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                    <div className="text-right mt-2">
                      <Label>Item Total: </Label>
                      <span className="text-lg font-semibold">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary - View Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_percent > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_percent}%):</span>
                    <span className="font-medium">
                      {formatCurrency((invoice.subtotal * invoice.tax_percent) / 100)}
                    </span>
                  </div>
                )}
                {invoice.extra_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Extra Fee:</span>
                    <span className="font-medium">{formatCurrency(invoice.extra_fee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoice.invoice_number}? 
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

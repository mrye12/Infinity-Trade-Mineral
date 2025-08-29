'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { createShipment, getAvailableInvoices, uploadShipmentDocument, addShipmentDocument } from '@/lib/shipment-service'
import type { User, Invoice } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Truck, 
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Ship,
  Calendar,
  Package,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const newShipmentSchema = z.object({
  invoice_id: z.string().optional(),
  vessel_name: z.string().min(1, 'Vessel name is required'),
  departure_port: z.string().min(1, 'Departure port is required'),
  arrival_port: z.string().min(1, 'Arrival port is required'),
  departure_date: z.string().min(1, 'Departure date is required'),
  arrival_date: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
})

type NewShipmentFormData = z.infer<typeof newShipmentSchema>

export default function NewShipmentPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // File upload states
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const router = useRouter()

  // Get default dates
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const defaultArrivalDate = nextWeek.toISOString().split('T')[0]

  const form = useForm<NewShipmentFormData>({
    resolver: zodResolver(newShipmentSchema),
    defaultValues: {
      invoice_id: '',
      vessel_name: '',
      departure_port: '',
      arrival_port: '',
      departure_date: today,
      arrival_date: defaultArrivalDate,
      quantity: 0,
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
        
        // Load available invoices
        const invoices = await getAvailableInvoices()
        setAvailableInvoices(invoices)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: NewShipmentFormData) => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      // Create shipment
      const shipmentData = {
        invoice_id: data.invoice_id || undefined,
        vessel_name: data.vessel_name,
        departure_port: data.departure_port,
        arrival_port: data.arrival_port,
        departure_date: data.departure_date,
        arrival_date: data.arrival_date || undefined,
        quantity: data.quantity,
      }

      const newShipment = await createShipment(shipmentData, user.id)

      // Upload documents if any
      if (selectedFiles.length > 0) {
        setUploadingFiles(true)
        
        for (const file of selectedFiles) {
          try {
            // Upload file to storage
            const fileUrl = await uploadShipmentDocument(newShipment.id, file)
            
            // Add document record to shipment
            await addShipmentDocument(newShipment.id, {
              name: file.name,
              url: fileUrl,
              type: file.type,
            })
          } catch (uploadError) {
            console.error('Error uploading file:', file.name, uploadError)
            // Continue with other files even if one fails
          }
        }
      }

      router.push('/shipments')
    } catch (err) {
      console.error('Error creating shipment:', err)
      setError('Failed to create shipment. Please try again.')
    } finally {
      setSaving(false)
      setUploadingFiles(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
          <h1 className="text-3xl font-bold tracking-tight">New Shipment</h1>
        </div>
        <Link href="/shipments">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shipments
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
          {/* Invoice Association */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Association</CardTitle>
              <CardDescription>
                Link this shipment to an existing invoice (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Invoice</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an invoice (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No invoice</SelectItem>
                        {availableInvoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - {invoice.customer_name} 
                            ({new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(invoice.total)})
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

          {/* Vessel Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="h-5 w-5 mr-2" />
                Vessel Information
              </CardTitle>
              <CardDescription>
                Enter vessel and route details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="vessel_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vessel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="departure_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Port *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Port of Jakarta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="arrival_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Port *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Port of Singapore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Shipment Details
              </CardTitle>
              <CardDescription>
                Quantity and schedule information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (tons) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="departure_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="arrival_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Arrival Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Shipping Documents
              </CardTitle>
              <CardDescription>
                Upload Bills of Lading, manifests, or other shipping documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload files
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/shipments">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || uploadingFiles}>
              {saving || uploadingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingFiles ? 'Uploading documents...' : 'Creating shipment...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Shipment
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

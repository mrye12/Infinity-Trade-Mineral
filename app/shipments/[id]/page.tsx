'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { getUser, getUserProfile } from '@/lib/auth'
import { 
  getShipment, 
  updateShipment, 
  updateShipmentStatus, 
  deleteShipment,
  getAvailableInvoices,
  uploadShipmentDocument,
  addShipmentDocument,
  removeShipmentDocument
} from '@/lib/shipment-service'
import type { User, Shipment, Invoice } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Truck, 
  Edit, 
  Save, 
  ArrowLeft, 
  Trash2,
  Ship,
  Calendar,
  Package,
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  Play,
  Loader2,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const editShipmentSchema = z.object({
  invoice_id: z.string().optional(),
  vessel_name: z.string().min(1, 'Vessel name is required'),
  departure_port: z.string().min(1, 'Departure port is required'),
  arrival_port: z.string().min(1, 'Arrival port is required'),
  departure_date: z.string().min(1, 'Departure date is required'),
  arrival_date: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
})

type EditShipmentFormData = z.infer<typeof editShipmentSchema>

interface ShipmentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  // Edit mode
  const searchParams = useSearchParams()
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true')

  const router = useRouter()

  const form = useForm<EditShipmentFormData>({
    resolver: zodResolver(editShipmentSchema),
    defaultValues: {
      invoice_id: '',
      vessel_name: '',
      departure_port: '',
      arrival_port: '',
      departure_date: '',
      arrival_date: '',
      quantity: 0,
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

        // Load shipment
        const shipmentData = await getShipment(resolvedParams.id)
        
        if (!shipmentData) {
          setError('Shipment not found')
          return
        }

        setShipment(shipmentData)

        // Load available invoices for edit mode
        const invoices = await getAvailableInvoices()
        setAvailableInvoices(invoices)

        // Set form values for edit mode
        if (isEditMode) {
          form.reset({
            invoice_id: shipmentData.invoice_id || '',
            vessel_name: shipmentData.vessel_name,
            departure_port: shipmentData.departure_port,
            arrival_port: shipmentData.arrival_port,
            departure_date: shipmentData.departure_date,
            arrival_date: shipmentData.arrival_date || '',
            quantity: shipmentData.quantity,
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load shipment')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, isEditMode, form])

  const toggleEditMode = () => {
    if (isEditMode && shipment) {
      // Reset form when canceling edit
      form.reset({
        invoice_id: shipment.invoice_id || '',
        vessel_name: shipment.vessel_name,
        departure_port: shipment.departure_port,
        arrival_port: shipment.arrival_port,
        departure_date: shipment.departure_date,
        arrival_date: shipment.arrival_date || '',
        quantity: shipment.quantity,
      })
    }
    setIsEditMode(!isEditMode)
  }

  const onSubmit = async (data: EditShipmentFormData) => {
    if (!shipment) return

    setSaving(true)
    setError(null)

    try {
      const updateData = {
        invoice_id: data.invoice_id || undefined,
        vessel_name: data.vessel_name,
        departure_port: data.departure_port,
        arrival_port: data.arrival_port,
        departure_date: data.departure_date,
        arrival_date: data.arrival_date || undefined,
        quantity: data.quantity,
      }

      const updatedShipment = await updateShipment(shipment.id, updateData)
      setShipment(updatedShipment)
      setIsEditMode(false)
    } catch (err) {
      console.error('Error updating shipment:', err)
      setError('Failed to update shipment')
    } finally {
      setSaving(false)
    }
  }

  const advanceStatus = async () => {
    if (!shipment) return

    const statusFlow = {
      'Scheduled': 'On Transit',
      'On Transit': 'Arrived',
      'Arrived': 'Completed'
    }
    
    const nextStatus = statusFlow[shipment.status as keyof typeof statusFlow]
    if (!nextStatus) return

    setStatusUpdating(true)
    try {
      const updatedShipment = await updateShipmentStatus(shipment.id, nextStatus as any)
      setShipment(updatedShipment)
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update shipment status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!shipment || userProfile?.role !== 'admin') return

    setDeleting(true)
    try {
      await deleteShipment(shipment.id)
      router.push('/shipments')
    } catch (error) {
      console.error('Error deleting shipment:', error)
      setError('Failed to delete shipment')
    } finally {
      setDeleting(false)
      setDeleteDialog(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadDocuments = async () => {
    if (!shipment || selectedFiles.length === 0) return

    setUploadingFiles(true)
    try {
      for (const file of selectedFiles) {
        // Upload file to storage
        const fileUrl = await uploadShipmentDocument(shipment.id, file)
        
        // Add document record to shipment
        await addShipmentDocument(shipment.id, {
          name: file.name,
          url: fileUrl,
          type: file.type,
        })
      }

      // Reload shipment to get updated documents
      const updatedShipment = await getShipment(shipment.id)
      if (updatedShipment) {
        setShipment(updatedShipment)
      }
      
      setSelectedFiles([])
    } catch (error) {
      console.error('Error uploading documents:', error)
      setError('Failed to upload some documents')
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeDocument = async (documentUrl: string) => {
    if (!shipment) return

    try {
      const updatedShipment = await removeShipmentDocument(shipment.id, documentUrl)
      setShipment(updatedShipment)
    } catch (error) {
      console.error('Error removing document:', error)
      setError('Failed to remove document')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'On Transit':
        return <Ship className="h-5 w-5 text-orange-500" />
      case 'Arrived':
        return <Package className="h-5 w-5 text-purple-500" />
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
        {status}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  if (error && !shipment) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Shipment not found</p>
            <Link href="/shipments">
              <Button className="mt-4">Back to Shipments</Button>
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
          <Truck className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {shipment.shipment_code}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(shipment.status)}
              {getStatusBadge(shipment.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canAdvanceStatus(shipment.status) && (
            <Button
              variant="outline"
              onClick={advanceStatus}
              disabled={statusUpdating}
              className="text-green-600"
            >
              {statusUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Advance Status
            </Button>
          )}
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
          <Link href="/shipments">
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
            {/* Invoice Association */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Association</CardTitle>
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
                <CardTitle>Vessel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="vessel_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vessel Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                <CardTitle>Shipment Details</CardTitle>
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
          {/* Shipment Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vessel & Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Vessel Name</Label>
                  <p className="font-medium flex items-center">
                    <Ship className="h-4 w-4 mr-2 text-blue-500" />
                    {shipment.vessel_name}
                  </p>
                </div>
                <div>
                  <Label>Route</Label>
                  <p className="font-medium">
                    {shipment.departure_port} → {shipment.arrival_port}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quantity</Label>
                  <p className="font-medium flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    {shipment.quantity} tons
                  </p>
                </div>
                <div>
                  <Label>Departure Date</Label>
                  <p className="font-medium">
                    {new Date(shipment.departure_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                {shipment.arrival_date && (
                  <div>
                    <Label>Expected Arrival</Label>
                    <p className="font-medium">
                      {new Date(shipment.arrival_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Information */}
          {(shipment as any).invoice && (
            <Card>
              <CardHeader>
                <CardTitle>Related Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Invoice Number</Label>
                    <p className="font-medium">{(shipment as any).invoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label>Customer</Label>
                    <p className="font-medium">{(shipment as any).invoice.customer_name}</p>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <p className="font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format((shipment as any).invoice.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Shipping Documents
                </span>
                {userProfile?.role === 'admin' && (
                  <Button
                    variant="outline"
                    onClick={uploadDocuments}
                    disabled={selectedFiles.length === 0 || uploadingFiles}
                  >
                    {uploadingFiles ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload (Admin only) */}
              {userProfile?.role === 'admin' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <Label htmlFor="document-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <span className="text-blue-600 hover:text-blue-500">
                        Click to upload documents
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="document-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Selected Files (pending upload) */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Files to Upload:</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Documents */}
              <div className="space-y-2">
                <Label>Uploaded Documents:</Label>
                {shipment.documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded</p>
                ) : (
                  shipment.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {userProfile?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeDocument(doc.url)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete shipment {shipment.shipment_code}? 
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

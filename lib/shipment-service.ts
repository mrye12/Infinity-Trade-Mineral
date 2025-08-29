import { createClient } from '@/lib/supabase/client'
import type { Shipment, CreateShipmentData, ShipmentDocument, Invoice } from '@/lib/types'

export interface ShipmentFilters {
  status?: string
  vessel?: string
  dateFrom?: string
  dateTo?: string
  invoice_id?: string
}

// Generate shipment code (SHIP-YYYY-NNNN)
export async function generateShipmentCode(): Promise<string> {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()
  
  // Get the latest shipment code for current year
  const { data, error } = await supabase
    .from('shipments')
    .select('shipment_code')
    .like('shipment_code', `SHIP-${currentYear}-%`)
    .order('shipment_code', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching shipment codes:', error)
    return `SHIP-${currentYear}-0001`
  }

  if (!data || data.length === 0) {
    return `SHIP-${currentYear}-0001`
  }

  // Extract number from last shipment (SHIP-2025-0001 -> 0001)
  const lastNumber = data[0].shipment_code.split('-')[2]
  const nextNumber = parseInt(lastNumber) + 1
  
  return `SHIP-${currentYear}-${nextNumber.toString().padStart(4, '0')}`
}

// Get all shipments with optional filters
export async function getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('shipments')
    .select(`
      *,
      invoice:invoices(id, invoice_number, customer_name, total),
      created_by_user:users(full_name, email)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.vessel) {
    query = query.ilike('vessel_name', `%${filters.vessel}%`)
  }

  if (filters?.dateFrom) {
    query = query.gte('departure_date', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('departure_date', filters.dateTo)
  }

  if (filters?.invoice_id) {
    query = query.eq('invoice_id', filters.invoice_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching shipments:', error)
    throw new Error('Failed to fetch shipments')
  }

  return (data || []) as Shipment[]
}

// Get single shipment by ID
export async function getShipment(id: string): Promise<Shipment | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      invoice:invoices(id, invoice_number, customer_name, total),
      created_by_user:users(full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching shipment:', error)
    return null
  }

  return data as Shipment
}

// Get available invoices for shipment selection
export async function getAvailableInvoices(): Promise<Invoice[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_name, total, status')
    .in('status', ['unpaid', 'paid']) // Only unpaid and paid invoices
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return data as Invoice[]
}

// Create new shipment
export async function createShipment(
  shipmentData: CreateShipmentData,
  userId: string
): Promise<Shipment> {
  const supabase = createClient()
  
  // Generate shipment code
  const shipmentCode = await generateShipmentCode()
  
  const { data, error } = await supabase
    .from('shipments')
    .insert({
      shipment_code: shipmentCode,
      invoice_id: shipmentData.invoice_id,
      vessel_name: shipmentData.vessel_name,
      departure_port: shipmentData.departure_port,
      arrival_port: shipmentData.arrival_port,
      departure_date: shipmentData.departure_date,
      arrival_date: shipmentData.arrival_date,
      quantity: shipmentData.quantity,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating shipment:', error)
    throw new Error('Failed to create shipment')
  }

  return data as Shipment
}

// Update shipment
export async function updateShipment(
  id: string,
  updates: Partial<CreateShipmentData>
): Promise<Shipment> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('shipments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shipment:', error)
    throw new Error('Failed to update shipment')
  }

  return data as Shipment
}

// Update shipment status
export async function updateShipmentStatus(
  id: string,
  status: 'Scheduled' | 'On Transit' | 'Arrived' | 'Completed'
): Promise<Shipment> {
  const supabase = createClient()
  
  const updateData: any = { status }
  
  // Auto-set arrival_date when status changes to 'Arrived' or 'Completed'
  if (status === 'Arrived' || status === 'Completed') {
    updateData.arrival_date = new Date().toISOString().split('T')[0]
  }
  
  const { data, error } = await supabase
    .from('shipments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shipment status:', error)
    throw new Error('Failed to update shipment status')
  }

  // Optional: Auto-update related invoice to paid when shipment is completed
  if (status === 'Completed' && data.invoice_id) {
    try {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', data.invoice_id)
    } catch (invoiceError) {
      console.error('Error updating related invoice:', invoiceError)
      // Don't throw error for invoice update failure
    }
  }

  return data as Shipment
}

// Delete shipment
export async function deleteShipment(id: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('shipments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting shipment:', error)
    throw new Error('Failed to delete shipment')
  }

  return true
}

// Upload document to Supabase Storage
export async function uploadShipmentDocument(
  shipmentId: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${shipmentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('shipment-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload document')
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('shipment-documents')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// Add document to shipment
export async function addShipmentDocument(
  shipmentId: string,
  document: Omit<ShipmentDocument, 'uploaded_at'>
): Promise<Shipment> {
  const supabase = createClient()
  
  // Get current shipment
  const { data: shipment, error: fetchError } = await supabase
    .from('shipments')
    .select('documents')
    .eq('id', shipmentId)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch shipment')
  }

  // Add new document to existing documents
  const newDocument = {
    ...document,
    uploaded_at: new Date().toISOString()
  }
  
  const updatedDocuments = [...(shipment.documents || []), newDocument]

  const { data, error } = await supabase
    .from('shipments')
    .update({ documents: updatedDocuments })
    .eq('id', shipmentId)
    .select()
    .single()

  if (error) {
    console.error('Error adding document:', error)
    throw new Error('Failed to add document')
  }

  return data as Shipment
}

// Remove document from shipment
export async function removeShipmentDocument(
  shipmentId: string,
  documentUrl: string
): Promise<Shipment> {
  const supabase = createClient()
  
  // Get current shipment
  const { data: shipment, error: fetchError } = await supabase
    .from('shipments')
    .select('documents')
    .eq('id', shipmentId)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch shipment')
  }

  // Remove document from array
  const updatedDocuments = (shipment.documents || []).filter(
    (doc: ShipmentDocument) => doc.url !== documentUrl
  )

  const { data, error } = await supabase
    .from('shipments')
    .update({ documents: updatedDocuments })
    .eq('id', shipmentId)
    .select()
    .single()

  if (error) {
    console.error('Error removing document:', error)
    throw new Error('Failed to remove document')
  }

  // Also delete file from storage
  try {
    const urlPath = new URL(documentUrl).pathname
    const filePath = urlPath.split('/shipment-documents/')[1]
    
    if (filePath) {
      await supabase.storage
        .from('shipment-documents')
        .remove([filePath])
    }
  } catch (storageError) {
    console.error('Error deleting file from storage:', storageError)
    // Don't throw error for storage cleanup failure
  }

  return data as Shipment
}

// Get shipment statistics for dashboard
export async function getShipmentStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('shipments')
    .select('status, departure_date, quantity')

  if (error) {
    console.error('Error fetching shipment stats:', error)
    return {
      total: 0,
      scheduled: 0,
      onTransit: 0,
      arrived: 0,
      completed: 0,
      totalQuantity: 0
    }
  }

  const shipments = data || []
  
  return {
    total: shipments.length,
    scheduled: shipments.filter(s => s.status === 'Scheduled').length,
    onTransit: shipments.filter(s => s.status === 'On Transit').length,
    arrived: shipments.filter(s => s.status === 'Arrived').length,
    completed: shipments.filter(s => s.status === 'Completed').length,
    totalQuantity: shipments.reduce((sum, s) => sum + (s.quantity || 0), 0)
  }
}

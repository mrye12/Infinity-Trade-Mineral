import { createClient } from '@/lib/supabase/client'
import type { Invoice, CreateInvoiceData, InvoiceItem } from '@/lib/types'

export interface InvoiceFilters {
  status?: string
  customer?: string
  dateFrom?: string
  dateTo?: string
}

// Generate invoice number (INV-YYYY-NNNN)
export async function generateInvoiceNumber(): Promise<string> {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()
  
  // Get the latest invoice number for current year
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-${currentYear}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching invoice numbers:', error)
    return `INV-${currentYear}-0001`
  }

  if (!data || data.length === 0) {
    return `INV-${currentYear}-0001`
  }

  // Extract number from last invoice (INV-2025-0001 -> 0001)
  const lastNumber = data[0].invoice_number.split('-')[2]
  const nextNumber = parseInt(lastNumber) + 1
  
  return `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`
}

// Get all invoices with optional filters
export async function getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('invoices')
    .select(`
      *,
      created_by_user:users(full_name, email)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.customer) {
    query = query.ilike('customer_name', `%${filters.customer}%`)
  }

  if (filters?.dateFrom) {
    query = query.gte('issue_date', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('issue_date', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching invoices:', error)
    throw new Error('Failed to fetch invoices')
  }

  return (data || []) as Invoice[]
}

// Get single invoice by ID
export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      created_by_user:users(full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching invoice:', error)
    return null
  }

  return data as Invoice
}

// Server-side functions should be in separate file

// Create new invoice
export async function createInvoice(
  invoiceData: CreateInvoiceData,
  userId: string
): Promise<Invoice> {
  const supabase = createClient()
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber()
  
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      customer_name: invoiceData.customer_name,
      customer_email: invoiceData.customer_email,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      tax_percent: invoiceData.tax_percent,
      extra_fee: invoiceData.extra_fee,
      total: invoiceData.total,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invoice:', error)
    throw new Error('Failed to create invoice')
  }

  return data as Invoice
}

// Update invoice
export async function updateInvoice(
  id: string,
  updates: Partial<CreateInvoiceData>
): Promise<Invoice> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating invoice:', error)
    throw new Error('Failed to update invoice')
  }

  return data as Invoice
}

// Update invoice status
export async function updateInvoiceStatus(
  id: string,
  status: 'unpaid' | 'paid' | 'overdue'
): Promise<Invoice> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating invoice status:', error)
    throw new Error('Failed to update invoice status')
  }

  return data as Invoice
}

// Delete invoice
export async function deleteInvoice(id: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting invoice:', error)
    throw new Error('Failed to delete invoice')
  }

  return true
}

// Calculate invoice totals
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxPercent: number = 0,
  extraFee: number = 0
) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxPercent) / 100
  const total = subtotal + taxAmount + extraFee

  return {
    subtotal,
    taxAmount,
    total
  }
}

// Calculate item total
export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

// Get invoice statistics for dashboard
export async function getInvoiceStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('invoices')
    .select('status, total, issue_date')

  if (error) {
    console.error('Error fetching invoice stats:', error)
    return {
      total: 0,
      paid: 0,
      unpaid: 0,
      overdue: 0,
      totalAmount: 0
    }
  }

  const invoices = data || []
  
  return {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    unpaid: invoices.filter(inv => inv.status === 'unpaid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  }
}

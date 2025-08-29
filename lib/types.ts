// Database table types for Infinity Trade Mineral

export interface User {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'staff'
  department?: string
  auth_user_id: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  description?: string
  file_path: string
  file_size: number
  file_type: string
  category: 'contract' | 'company_doc' | 'report' | 'other'
  uploaded_by: string
  is_public: boolean
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email?: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax_percent: number
  extra_fee: number
  total: number
  status: 'unpaid' | 'paid' | 'overdue'
  created_by: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface CreateInvoiceData {
  customer_name: string
  customer_email?: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax_percent: number
  extra_fee: number
  total: number
}

export interface Shipment {
  id: string
  shipment_code: string
  invoice_id?: string
  vessel_name: string
  departure_port: string
  arrival_port: string
  departure_date: string
  arrival_date?: string
  quantity: number // in tons
  status: 'Scheduled' | 'On Transit' | 'Arrived' | 'Completed'
  documents: ShipmentDocument[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface ShipmentDocument {
  name: string
  url: string
  type: string
  uploaded_at: string
}

export interface CreateShipmentData {
  invoice_id?: string
  vessel_name: string
  departure_port: string
  arrival_port: string
  departure_date: string
  arrival_date?: string
  quantity: number
}

export interface StockOffice {
  id: string
  item_name: string
  category: 'office_supplies' | 'equipment' | 'consumables'
  current_stock: number
  min_stock: number
  unit: string
  location: string
  last_updated_by: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateStockData {
  item_name: string
  category: 'office_supplies' | 'equipment' | 'consumables'
  current_stock: number
  min_stock: number
  unit: string
  location: string
  notes?: string
}

export interface UpdateStockData {
  item_name?: string
  category?: 'office_supplies' | 'equipment' | 'consumables'
  current_stock?: number
  min_stock?: number
  unit?: string
  location?: string
  notes?: string
}

export interface StockMovement {
  id: string
  stock_id: string
  movement_type: 'in' | 'out'
  quantity: number
  reason: string
  performed_by: string
  created_at: string
}

export interface StockFilters {
  category?: string
  location?: string
  lowStock?: boolean
  search?: string
}

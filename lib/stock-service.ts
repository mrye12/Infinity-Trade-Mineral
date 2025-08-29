import { createClient } from '@/lib/supabase/client'
import type { StockOffice, CreateStockData, UpdateStockData, StockFilters } from '@/lib/types'

// Get all stock items with optional filters
export async function getStockItems(filters?: StockFilters): Promise<StockOffice[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('stock_office')
    .select(`
      *,
      last_updated_user:users(full_name, email)
    `)
    .order('item_name', { ascending: true })

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters?.location && filters.location !== 'all') {
    query = query.eq('location', filters.location)
  }

  if (filters?.search) {
    query = query.or(`item_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching stock items:', error)
    throw new Error('Failed to fetch stock items')
  }

  let stockItems = (data || []) as StockOffice[]

  // Filter low stock items if requested
  if (filters?.lowStock) {
    stockItems = stockItems.filter(item => item.current_stock <= item.min_stock)
  }

  return stockItems
}

// Get single stock item by ID
export async function getStockItem(id: string): Promise<StockOffice | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .select(`
      *,
      last_updated_user:users(full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching stock item:', error)
    return null
  }

  return data as StockOffice
}

// Create new stock item
export async function createStockItem(
  stockData: CreateStockData,
  userId: string
): Promise<StockOffice> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .insert({
      item_name: stockData.item_name,
      category: stockData.category,
      current_stock: stockData.current_stock,
      min_stock: stockData.min_stock,
      unit: stockData.unit,
      location: stockData.location,
      notes: stockData.notes,
      last_updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating stock item:', error)
    throw new Error('Failed to create stock item')
  }

  return data as StockOffice
}

// Update stock item details
export async function updateStockItem(
  id: string,
  updates: UpdateStockData,
  userId: string
): Promise<StockOffice> {
  const supabase = createClient()
  
  const updateData = {
    ...updates,
    last_updated_by: userId,
  }
  
  const { data, error } = await supabase
    .from('stock_office')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating stock item:', error)
    throw new Error('Failed to update stock item')
  }

  return data as StockOffice
}

// Update stock quantity (stock in/out)
export async function updateStockQuantity(
  id: string,
  newQuantity: number,
  userId: string,
  reason?: string
): Promise<StockOffice> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .update({
      current_stock: newQuantity,
      last_updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating stock quantity:', error)
    throw new Error('Failed to update stock quantity')
  }

  return data as StockOffice
}

// Adjust stock (add or subtract from current stock)
export async function adjustStock(
  id: string,
  adjustment: number,
  userId: string,
  reason: string = 'Manual adjustment'
): Promise<StockOffice> {
  const supabase = createClient()
  
  // Get current stock first
  const currentItem = await getStockItem(id)
  if (!currentItem) {
    throw new Error('Stock item not found')
  }

  const newQuantity = Math.max(0, currentItem.current_stock + adjustment)
  
  const { data, error } = await supabase
    .from('stock_office')
    .update({
      current_stock: newQuantity,
      last_updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error adjusting stock:', error)
    throw new Error('Failed to adjust stock')
  }

  return data as StockOffice
}

// Delete stock item
export async function deleteStockItem(id: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('stock_office')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting stock item:', error)
    throw new Error('Failed to delete stock item')
  }

  return true
}

// Get low stock items (current_stock <= min_stock)
export async function getLowStockItems(): Promise<StockOffice[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .select(`
      *,
      last_updated_user:users(full_name, email)
    `)
    .filter('current_stock', 'lte', 'min_stock')
    .order('current_stock', { ascending: true })

  if (error) {
    console.error('Error fetching low stock items:', error)
    return []
  }

  return (data || []) as StockOffice[]
}

// Get stock statistics for dashboard
export async function getStockStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .select('current_stock, min_stock, category')

  if (error) {
    console.error('Error fetching stock stats:', error)
    return {
      totalItems: 0,
      lowStockItems: 0,
      categories: {
        office_supplies: 0,
        equipment: 0,
        consumables: 0
      },
      totalValue: 0
    }
  }

  const items = data || []
  const lowStockItems = items.filter(item => item.current_stock <= item.min_stock)
  
  const categories = items.reduce((acc, item) => {
    acc[item.category as keyof typeof acc] = (acc[item.category as keyof typeof acc] || 0) + 1
    return acc
  }, {
    office_supplies: 0,
    equipment: 0,
    consumables: 0
  })

  return {
    totalItems: items.length,
    lowStockItems: lowStockItems.length,
    categories,
    totalStockValue: items.reduce((sum, item) => sum + item.current_stock, 0)
  }
}

// Get unique locations for filtering
export async function getStockLocations(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('stock_office')
    .select('location')
    .not('location', 'is', null)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  // Get unique locations
  const locations = Array.from(new Set(data.map(item => item.location))).filter(Boolean)
  return locations.sort()
}

// Check if item is low stock
export function isLowStock(item: StockOffice): boolean {
  return item.current_stock <= item.min_stock
}

// Get stock status
export function getStockStatus(item: StockOffice): 'out_of_stock' | 'low_stock' | 'normal' {
  if (item.current_stock === 0) return 'out_of_stock'
  if (item.current_stock <= item.min_stock) return 'low_stock'
  return 'normal'
}

// Format stock status for display
export function getStockStatusBadge(item: StockOffice) {
  const status = getStockStatus(item)
  
  switch (status) {
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    case 'low_stock':
      return {
        label: 'Low Stock',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    default:
      return {
        label: 'In Stock',
        variant: 'outline' as const,
        className: 'bg-green-100 text-green-800 border-green-200'
      }
  }
}

// Category display names
export const CATEGORY_LABELS = {
  office_supplies: 'Office Supplies',
  equipment: 'Equipment',
  consumables: 'Consumables'
} as const

// Common units for stock items
export const COMMON_UNITS = [
  'pcs', 'box', 'pack', 'bottle', 'kg', 'liter', 'meter', 'roll', 'set', 'unit'
] as const

// Common locations
export const COMMON_LOCATIONS = [
  'Storage Room',
  'Office Floor 1',
  'Office Floor 2', 
  'IT Room',
  'Supply Cabinet',
  'Reception Desk',
  'Meeting Room',
  'Kitchen'
] as const

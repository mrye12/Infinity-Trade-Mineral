import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export interface DashboardStats {
  invoices: {
    totalThisMonth: number
    totalAmount: number
    paid: number
    pending: number
    overdue: number
  }
  shipments: {
    totalThisMonth: number
    delivered: number
    inTransit: number
    preparing: number
    cancelled: number
  }
  documents: {
    total: number
    contracts: number
    reports: number
    companyDocs: number
    other: number
  }
  stock: {
    totalItems: number
    lowStock: number
    outOfStock: number
    categories: {
      officeSupplies: number
      equipment: number
      consumables: number
    }
  }
}

export interface ChartData {
  shipmentTrend: Array<{
    month: string
    shipments: number
  }>
  invoiceStatus: Array<{
    name: string
    value: number
    color: string
  }>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const now = new Date()
  const startMonth = startOfMonth(now)
  const endMonth = endOfMonth(now)

  try {
    // Fetch invoices data
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', startMonth.toISOString())
      .lte('created_at', endMonth.toISOString())

    const invoicesThisMonth = invoicesData || []
    const totalAmount = invoicesThisMonth.reduce((sum, invoice) => sum + (invoice.amount || 0), 0)
    const invoiceStats = {
      totalThisMonth: invoicesThisMonth.length,
      totalAmount,
      paid: invoicesThisMonth.filter(i => i.status === 'paid').length,
      pending: invoicesThisMonth.filter(i => i.status === 'pending').length,
      overdue: invoicesThisMonth.filter(i => i.status === 'overdue').length,
    }

    // Fetch shipments data
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select('*')
      .gte('created_at', startMonth.toISOString())
      .lte('created_at', endMonth.toISOString())

    const shipmentsThisMonth = shipmentsData || []
    const shipmentStats = {
      totalThisMonth: shipmentsThisMonth.length,
      delivered: shipmentsThisMonth.filter(s => s.status === 'delivered').length,
      inTransit: shipmentsThisMonth.filter(s => s.status === 'in_transit').length,
      preparing: shipmentsThisMonth.filter(s => s.status === 'preparing').length,
      cancelled: shipmentsThisMonth.filter(s => s.status === 'cancelled').length,
    }

    // Fetch documents data
    const { data: documentsData } = await supabase
      .from('documents')
      .select('*')

    const documents = documentsData || []
    const documentStats = {
      total: documents.length,
      contracts: documents.filter(d => d.category === 'contract').length,
      reports: documents.filter(d => d.category === 'report').length,
      companyDocs: documents.filter(d => d.category === 'company_doc').length,
      other: documents.filter(d => d.category === 'other').length,
    }

    // Fetch stock data
    const { data: stockData } = await supabase
      .from('stock_office')
      .select('*')

    const stock = stockData || []
    const stockStats = {
      totalItems: stock.length,
      lowStock: stock.filter(s => s.current_stock <= s.min_stock && s.current_stock > 0).length,
      outOfStock: stock.filter(s => s.current_stock === 0).length,
      categories: {
        officeSupplies: stock.filter(s => s.category === 'office_supplies').length,
        equipment: stock.filter(s => s.category === 'equipment').length,
        consumables: stock.filter(s => s.category === 'consumables').length,
      }
    }

    return {
      invoices: invoiceStats,
      shipments: shipmentStats,
      documents: documentStats,
      stock: stockStats,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if there's an error
    return {
      invoices: {
        totalThisMonth: 0,
        totalAmount: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
      },
      shipments: {
        totalThisMonth: 0,
        delivered: 0,
        inTransit: 0,
        preparing: 0,
        cancelled: 0,
      },
      documents: {
        total: 0,
        contracts: 0,
        reports: 0,
        companyDocs: 0,
        other: 0,
      },
      stock: {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        categories: {
          officeSupplies: 0,
          equipment: 0,
          consumables: 0,
        }
      }
    }
  }
}

export async function getChartData(): Promise<ChartData> {
  const supabase = await createClient()

  try {
    // Get shipment trend for last 6 months
    const shipmentTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const startMonth = startOfMonth(date)
      const endMonth = endOfMonth(date)

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id')
        .gte('created_at', startMonth.toISOString())
        .lte('created_at', endMonth.toISOString())

      shipmentTrend.push({
        month: format(date, 'MMM'),
        shipments: shipments?.length || 0,
      })
    }

    // Get invoice status distribution
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('status')

    const invoices = allInvoices || []
    const statusCounts = {
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      draft: invoices.filter(i => i.status === 'draft').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
    }

    const invoiceStatus = [
      { name: 'Paid', value: statusCounts.paid, color: '#22c55e' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' },
      { name: 'Draft', value: statusCounts.draft, color: '#6b7280' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#94a3b8' },
    ].filter(item => item.value > 0) // Only show non-zero values

    return {
      shipmentTrend,
      invoiceStatus,
    }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return {
      shipmentTrend: [],
      invoiceStatus: [],
    }
  }
}

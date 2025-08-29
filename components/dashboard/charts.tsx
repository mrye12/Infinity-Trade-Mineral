'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ShipmentTrendData {
  month: string
  shipments: number
}

interface InvoiceStatusData {
  name: string
  value: number
  color: string
}

interface ShipmentTrendChartProps {
  data: ShipmentTrendData[]
}

interface InvoiceStatusChartProps {
  data: InvoiceStatusData[]
}

export function ShipmentTrendChart({ data }: ShipmentTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Trend</CardTitle>
        <CardDescription>Shipments over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="shipments" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status</CardTitle>
          <CardDescription>Distribution of invoice statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>No invoice data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status</CardTitle>
        <CardDescription>Distribution of invoice statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [value, 'Count']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

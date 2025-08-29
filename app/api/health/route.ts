import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check Supabase connection
    const supabase = await createClient()
    
    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Test storage connectivity
    const { data: storageTest, error: storageError } = await supabase.storage
      .from('shipment-documents')
      .list('', { limit: 1 })
    
    if (storageError && storageError.message !== 'The resource was not found') {
      throw new Error(`Storage error: ${storageError.message}`)
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`
        },
        storage: {
          status: 'connected',
          buckets: ['shipment-documents', 'documents']
        },
        auth: {
          status: 'configured',
          provider: 'supabase'
        }
      },
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        nodeVersion: process.version
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 503 })
  }
}

'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RefreshButton() {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  )
}

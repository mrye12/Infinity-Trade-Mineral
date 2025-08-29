import { getServerUser, getServerUserProfile } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default async function DocumentsPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const userProfile = await getServerUserProfile(user.id)

  if (!userProfile) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>
            Phase 4 - This section will handle company documents, contracts, and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Document management coming in Phase 4</p>
            <p className="text-sm">Upload, organize, and manage company documents</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

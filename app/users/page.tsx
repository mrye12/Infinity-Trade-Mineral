import { getServerUser, getServerUserProfile } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserPlus, Shield, User as UserIcon } from 'lucide-react'
import type { User } from '@/lib/types'

export default async function UsersPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const userProfile = await getServerUserProfile(user.id)

  if (!userProfile) {
    redirect('/auth/login')
  }

  // Check if user is admin
  if (userProfile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all users
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const allUsers = users as User[] || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter(u => u.role === 'staff').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Staff accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Error loading users</p>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground">Invite users to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {user.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.department || 'Not assigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={user.id === userProfile.id}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={user.id === userProfile.id || user.role === 'admin'}
                        >
                          {user.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common user management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite New User
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Manage Permissions
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Export User List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Management Info</CardTitle>
          <CardDescription>
            Important information about user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium flex items-center mb-2">
                <Shield className="h-4 w-4 mr-2 text-red-500" />
                Admin Role
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full access to all modules</li>
                <li>• User management capabilities</li>
                <li>• Invoice and stock management</li>
                <li>• System configuration</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium flex items-center mb-2">
                <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                Staff Role
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Documents access</li>
                <li>• Shipment tracking</li>
                <li>• Limited dashboard view</li>
                <li>• No administrative functions</li>
              </ul>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> User management features are ready for Phase 3. 
              Edit and role change functionality will be implemented in future phases.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

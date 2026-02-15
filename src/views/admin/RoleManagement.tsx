import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus, Shield, ShieldCheck, User, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type AppRole = 'admin' | 'warehouse_operator' | 'user';

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: AppRole[];
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string | null;
}

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'bg-destructive text-destructive-foreground', icon: ShieldCheck },
  warehouse_operator: { label: 'Warehouse Operator', color: 'bg-amber-500 text-white', icon: Shield },
  user: { label: 'User', color: 'bg-muted text-muted-foreground', icon: User },
};

export const RoleManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('warehouse_operator');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;
    
    // Check if role already exists
    if (selectedUser.roles.includes(newRole)) {
      toast({
        title: 'Role exists',
        description: `${selectedUser.email} already has the ${roleConfig[newRole].label} role`,
        variant: 'destructive',
      });
      return;
    }

    setIsAddingRole(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: newRole,
        });

      if (error) throw error;

      toast({
        title: 'Role added',
        description: `${roleConfig[newRole].label} role added to ${selectedUser.email}`,
      });
      
      setDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: 'Failed to add role',
        variant: 'destructive',
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: 'Role removed',
        description: `${roleConfig[role].label} role removed`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);
    
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-typewriter font-bold">Role Management</h1>
          <p className="text-muted-foreground">Assign and manage user roles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('admin')).length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warehouse Operators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('warehouse_operator')).length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage roles for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="warehouse_operator">Operators Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-xs">No roles</Badge>
                            ) : (
                              user.roles.map((role) => {
                                const config = roleConfig[role];
                                return (
                                  <div key={role} className="flex items-center gap-1">
                                    <Badge className={`text-xs ${config.color}`}>
                                      {config.label}
                                    </Badge>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Remove {config.label} role from {user.email}?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleRemoveRole(user.id, role)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) setSelectedUser(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Role</DialogTitle>
                                <DialogDescription>
                                  Add a role to {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Select value={newRole} onValueChange={(val) => setNewRole(val as AppRole)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-destructive" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="warehouse_operator">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-amber-500" />
                                        Warehouse Operator
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAddRole} disabled={isAddingRole}>
                                  {isAddingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Add Role
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

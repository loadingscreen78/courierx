import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
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

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: ShieldCheck },
  warehouse_operator: { label: 'Warehouse Operator', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: Shield },
  user: { label: 'User', color: 'bg-white/10 text-gray-400 border border-white/10', icon: User },
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
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('user_id, email, full_name, created_at').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.user_id, email: profile.email, full_name: profile.full_name, created_at: profile.created_at,
        roles: (roles || []).filter(r => r.user_id === profile.user_id).map(r => r.role as AppRole),
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;
    if (selectedUser.roles.includes(newRole)) { toast({ title: 'Role exists', description: `${selectedUser.email} already has the ${roleConfig[newRole].label} role`, variant: 'destructive' }); return; }
    setIsAddingRole(true);
    try {
      const { error } = await supabase.from('user_roles').insert({ user_id: selectedUser.id, role: newRole });
      if (error) throw error;
      toast({ title: 'Role added', description: `${roleConfig[newRole].label} role added to ${selectedUser.email}` });
      setDialogOpen(false); setSelectedUser(null); fetchUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({ title: 'Error', description: 'Failed to add role', variant: 'destructive' });
    } finally { setIsAddingRole(false); }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      if (error) throw error;
      toast({ title: 'Role removed', description: `${roleConfig[role].label} role removed` });
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({ title: 'Error', description: 'Failed to remove role', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Management</h1>
          <p className="text-gray-400">Assign and manage user roles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Admins', icon: ShieldCheck, iconColor: 'text-red-500', count: users.filter(u => u.roles.includes('admin')).length },
            { label: 'Warehouse Operators', icon: Shield, iconColor: 'text-blue-500', count: users.filter(u => u.roles.includes('warehouse_operator')).length },
            { label: 'Total Users', icon: User, iconColor: 'text-gray-400', count: users.length },
          ].map(({ label, icon: Icon, iconColor, count }) => (
            <div key={label} className="bg-[#16161a] rounded-[2rem] border border-white/5 p-6 shadow-2xl">
              <p className="text-sm text-gray-500 mb-2">{label}</p>
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${iconColor}`} />
                <span className="text-2xl font-bold text-white">{count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Users Card */}
        <div className="bg-[#16161a] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-white font-semibold">Users</h3>
            <p className="text-xs text-gray-500">Manage roles for all users</p>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input placeholder="Search by email or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none transition-colors" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-[#16161a] border-white/10">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="warehouse_operator">Operators Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users found</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Roles</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-gray-500">No roles</span>
                            ) : user.roles.map((role) => (
                              <div key={role} className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${roleConfig[role].color}`}>{roleConfig[role].label}</span>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-[#16161a] border-white/10 text-white">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-400">Remove {roleConfig[role].label} role from {user.email}? This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-white/10 border-white/10 text-gray-300 hover:bg-white/20">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveRole(user.id, role)} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4 text-right">
                          <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedUser(null); }}>
                            <DialogTrigger asChild>
                              <button onClick={() => { setSelectedUser(user); setDialogOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20 transition-colors ml-auto">
                                <UserPlus className="h-4 w-4" /> Add Role
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#16161a] border-white/10 text-white">
                              <DialogHeader>
                                <DialogTitle>Add Role</DialogTitle>
                                <DialogDescription className="text-gray-400">Add a role to {user.email}</DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Select value={newRole} onValueChange={(val) => setNewRole(val as AppRole)}>
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select role" /></SelectTrigger>
                                  <SelectContent className="bg-[#16161a] border-white/10">
                                    <SelectItem value="admin"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-500" /> Admin</div></SelectItem>
                                    <SelectItem value="warehouse_operator"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> Warehouse Operator</div></SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20 transition-colors">Cancel</button>
                                <button onClick={handleAddRole} disabled={isAddingRole} className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-all">
                                  {isAddingRole && <Loader2 className="h-4 w-4 animate-spin" />} Add Role
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

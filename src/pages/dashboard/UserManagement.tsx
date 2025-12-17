import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteAlertDialog } from "@/components/ui/delete-alert-dialog";
import { UserPlus, Shield, Loader2, Trash2, Plus, KeyRound } from "lucide-react";

type AppRole = "admin" | "employee";

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

export default function UserManagement() {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [roleDeleteDialogOpen, setRoleDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ userId: string; role: AppRole; userName: string } | null>(null);

  // Create user form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("employee");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = profiles.map((profile) => ({
        ...profile,
        roles: roles
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole),
      }));

      return usersWithRoles;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string; role: AppRole }) => {
      const response = await supabase.functions.invoke("create-user", {
        body: data,
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Berhasil",
        description: "Akun berhasil dibuat",
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat akun",
        variant: "destructive",
      });
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Berhasil",
        description: "Role berhasil ditambahkan",
      });
      setIsRoleDialogOpen(false);
      setSelectedRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message.includes("duplicate")
          ? "User sudah memiliki role ini"
          : error.message,
        variant: "destructive",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Berhasil",
        description: "Role berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await supabase.functions.invoke("reset-user-password", {
        body: { userId, newPassword },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Password berhasil direset",
      });
      setIsResetPasswordDialogOpen(false);
      setResetPassword("");
      setConfirmResetPassword("");
      setSelectedUserId(null);
      setSelectedUserName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mereset password",
        variant: "destructive",
      });
    },
  });

  const resetCreateForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewFullName("");
    setNewRole("employee");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({
      email: newEmail,
      password: newPassword,
      fullName: newFullName,
      role: newRole,
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !resetPassword) {
      toast({
        title: "Error",
        description: "Password harus diisi",
        variant: "destructive",
      });
      return;
    }
    if (resetPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }
    if (resetPassword !== confirmResetPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUserId, newPassword: resetPassword });
  };

  const handleAddRole = () => {
    if (!selectedUserId || !selectedRole) return;
    addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola akun dan role karyawan
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Buat Akun Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Akun Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap *</Label>
                <Input
                  id="fullName"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee (Karyawan)</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Buat Akun
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.full_name}</p>
                      </TableCell>
                      <TableCell>
                        {user.phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === "admin" ? "default" : "secondary"}
                                className="cursor-pointer group"
                                onClick={() => {
                                  setRoleToDelete({ userId: user.user_id, role, userName: user.full_name });
                                  setRoleDeleteDialogOpen(true);
                                }}
                              >
                                {role}
                                <Trash2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Belum ada role
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserId(user.user_id);
                              setSelectedUserName(user.full_name);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4 mr-1" />
                            Reset Password
                          </Button>
                          <Dialog
                            open={isRoleDialogOpen && selectedUserId === user.user_id}
                            onOpenChange={(open) => {
                              setIsRoleDialogOpen(open);
                              if (open) {
                                setSelectedUserId(user.user_id);
                              } else {
                                setSelectedUserId(null);
                                setSelectedRole("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4 mr-1" />
                                Tambah Role
                              </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Tambah Role untuk {user.full_name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Select
                                value={selectedRole}
                                onValueChange={(v) => setSelectedRole(v as AppRole)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsRoleDialogOpen(false)}
                                >
                                  Batal
                                </Button>
                                <Button
                                  onClick={handleAddRole}
                                  disabled={!selectedRole || addRoleMutation.isPending}
                                >
                                  {addRoleMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  )}
                                  Tambah
                                </Button>
                              </div>
                            </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada user terdaftar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={(open) => {
        setIsResetPasswordDialogOpen(open);
        if (!open) {
          setResetPassword("");
          setConfirmResetPassword("");
          setSelectedUserId(null);
          setSelectedUserName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password untuk {selectedUserName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="resetPassword">Password Baru *</Label>
              <Input
                id="resetPassword"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmResetPassword">Konfirmasi Password *</Label>
              <Input
                id="confirmResetPassword"
                type="password"
                value={confirmResetPassword}
                onChange={(e) => setConfirmResetPassword(e.target.value)}
                placeholder="Ulangi password"
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetPasswordDialogOpen(false);
                  setResetPassword("");
                  setConfirmResetPassword("");
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <DeleteAlertDialog
        open={roleDeleteDialogOpen}
        onOpenChange={setRoleDeleteDialogOpen}
        title="Hapus Role"
        description={`Apakah Anda yakin ingin menghapus role "${roleToDelete?.role}" dari ${roleToDelete?.userName}?`}
        onConfirm={() => {
          if (roleToDelete) {
            removeRoleMutation.mutate({
              userId: roleToDelete.userId,
              role: roleToDelete.role,
            });
            setRoleDeleteDialogOpen(false);
            setRoleToDelete(null);
          }
        }}
        isLoading={removeRoleMutation.isPending}
      />
    </div>
  );
}

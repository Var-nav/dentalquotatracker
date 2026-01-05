import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCog, Users } from "lucide-react";
import { Enums } from "@/integrations/supabase/types";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: Enums<"app_role"> | null;
  roleId: string | null;
}

export function RoleManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<Enums<"app_role"> | "">("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (rolesError) throw rolesError;

      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const usersData: UserWithRole[] = profiles.map((profile) => {
        const authUser = authUsers?.find((u: any) => u.id === profile.id);
        const userRole = roles.find((r) => r.user_id === profile.id);

        return {
          id: profile.id,
          email: authUser?.email || "No email",
          full_name: profile.full_name,
          role: userRole?.role || null,
          roleId: userRole?.id || null,
        };
      });

      setUsers(usersData);
    } catch (error: any) {
      console.error("Failed to load users", error);
      toast({
        title: "Error loading users",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Enums<"app_role">) => {
    try {
      setUpdating(userId);

      const user = users.find((u) => u.id === userId);
      if (!user) return;

      if (user.roleId) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("id", user.roleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Role updated",
        description: `User role changed to ${newRole} successfully.`,
      });

      await loadUsers();
    } catch (error: any) {
      console.error("Failed to update role", error);
      toast({
        title: "Error updating role",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkRoleAssign = async () => {
    if (!bulkRole || selectedUsers.size === 0) {
      toast({
        title: "Invalid selection",
        description: "Please select users and a role to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating("bulk");

      for (const userId of Array.from(selectedUsers)) {
        const user = users.find((u) => u.id === userId);
        if (!user) continue;

        if (user.roleId) {
          await supabase
            .from("user_roles")
            .update({ role: bulkRole })
            .eq("id", user.roleId);
        } else {
          await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: bulkRole });
        }
      }

      toast({
        title: "Bulk role assignment complete",
        description: `Updated ${selectedUsers.size} user(s) to ${bulkRole}.`,
      });

      setSelectedUsers(new Set());
      setBulkRole("");
      await loadUsers();
    } catch (error: any) {
      console.error("Failed bulk role assignment", error);
      toast({
        title: "Error in bulk assignment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading roles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>Assign and modify user roles (Admin, Senior learner, Learner)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Assignment Section */}
        {selectedUsers.size > 0 && (
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{selectedUsers.size} user(s) selected</p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Assign role to selected users</Label>
                <Select value={bulkRole} onValueChange={(value) => setBulkRole(value as Enums<"app_role">)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="student">Learner</SelectItem>
                    <SelectItem value="instructor">Senior learner</SelectItem>
                    <SelectItem value="co-admin">Co-Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleBulkRoleAssign} 
                disabled={updating === "bulk" || !bulkRole}
                className="shrink-0"
              >
                Assign Role
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedUsers(new Set())}
                className="shrink-0"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Select All */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            checked={selectedUsers.size === users.length && users.length > 0}
            onCheckedChange={selectAll}
            id="select-all"
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select all users
          </Label>
        </div>

        {/* User List */}
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No users found.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                    id={`user-${user.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name || "No name set"}</p>
                      {user.role && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Role:</Label>
                  <Select
                    value={user.role || ""}
                    onValueChange={(value) => handleRoleChange(user.id, value as Enums<"app_role">)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      <SelectItem value="student">Learner</SelectItem>
                      <SelectItem value="instructor">Senior learner</SelectItem>
                      <SelectItem value="co-admin">Co-Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
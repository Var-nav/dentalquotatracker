import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Search, Shield, Trash2, Upload } from "lucide-react";
import { parseSheetData } from "@/lib/parseSheetData";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
  batch: string | null;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [importText, setImportText] = useState("");
  const [processingImport, setProcessingImport] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: userBatches, error: batchesError } = await supabase
        .from("user_batches")
        .select("user_id, batch_id, batches(name)");

      if (batchesError) throw batchesError;

      const {
        data: { users: authUsers },
        error: authError,
      } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const combined: AdminUser[] = profiles.map((profile) => {
        const authUser = authUsers?.find((u: any) => u.id === profile.id);
        const role = roles.find((r) => r.user_id === profile.id);
        const batch = userBatches.find((b) => b.user_id === profile.id);

        return {
          id: profile.id,
          email: authUser?.email || "No email",
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: role?.role || null,
          batch: (batch?.batches as any)?.name || null,
        };
      });

      setUsers(combined);
    } catch (error: any) {
      console.error("Failed to load users", error);
      toast({
        title: "Error loading users",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [users, searchQuery],
  );

  const stats = useMemo(() => {
    const counts: Record<string, number> = { student: 0, instructor: 0, admin: 0, "co-admin": 0 };
    for (const u of users) {
      if (u.role && counts[u.role] !== undefined) {
        counts[u.role]++;
      }
    }
    return counts;
  }, [users]);

  const handlePromoteToCoAdmin = async (userId: string) => {
    try {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: "co-admin" })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "co-admin" });
        if (error) throw error;
      }

      toast({ title: "Promoted", description: "User is now a Co-Admin." });
      await loadUsers();
    } catch (error: any) {
      console.error("Promote error", error);
      toast({
        title: "Could not promote",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoteToStudent = async (userId: string) => {
    try {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: "student" })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "student" });
        if (error) throw error;
      }

      toast({ title: "Role updated", description: "User role reverted to Student." });
      await loadUsers();
    } catch (error: any) {
      console.error("Demote error", error);
      toast({
        title: "Could not update role",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      toast({ title: "User removed", description: "Access has been revoked." });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      console.error("Ban error", error);
      toast({
        title: "Could not remove user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProcessImport = async () => {
    try {
      setProcessingImport(true);
      const rows = parseSheetData(importText);

      if (rows.length === 0) {
        toast({
          title: "Nothing to import",
          description: "Please paste at least one valid row.",
          variant: "destructive",
        });
        return;
      }

      const { data: batches, error: batchError } = await supabase
        .from("batches")
        .select("id, name");
      if (batchError) throw batchError;

      const batchMap = new Map<string, string>();
      batches?.forEach((b) => {
        batchMap.set((b.name || "").toLowerCase(), b.id);
      });

      const defaultBatchId = batches?.[0]?.id || null;

      const payload = rows.map((row) => {
        const batchId =
          batchMap.get(row.batch.toLowerCase()) ??
          batchMap.get("batch a") ??
          defaultBatchId;

        return {
          email: row.email,
          assigned_role: "student" as const,
          assigned_batch: batchId,
          assigned_department: null,
        };
      });

      const { error } = await supabase.from("whitelist_invites").insert(payload);
      if (error) throw error;

      toast({
        title: "Import processed",
        description: `Queued ${payload.length} invite(s).`,
      });
      setImportText("");
    } catch (error: any) {
      console.error("Import error", error);
      toast({
        title: "Import failed",
        description: error.message || "Please check your data and try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingImport(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            <Shield className="h-5 w-5 text-primary" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>Chief admin overview of users, roles, and bulk onboarding.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="stats">Role Stats</TabsTrigger>
          <TabsTrigger value="import">Smart Import</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>Search, promote, demote, or remove users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={loadUsers} disabled={loadingUsers}>
                  Refresh
                </Button>
              </div>

              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No users found matching your search.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{user.full_name || "No name set"}</p>
                          {user.role && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {user.role}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.batch && <span>Batch: {user.batch}</span>}
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromoteToCoAdmin(user.id)}
                        >
                          Promote to Co-Admin
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDemoteToStudent(user.id)}
                        >
                          Demote to Student
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleBanUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>Snapshot of how users are distributed across roles.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Learners</p>
                <p className="text-2xl font-semibold">{stats.student}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Senior learners</p>
                <p className="text-2xl font-semibold">{stats.instructor}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Admins</p>
                <p className="text-2xl font-semibold">{stats.admin}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Co-Admins</p>
                <p className="text-2xl font-semibold">{stats["co-admin"]}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Smart Import
              </CardTitle>
              <CardDescription>
                Paste rows from Excel/Sheets and we will create whitelist invites for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkImport">Paste from Excel/Sheets</Label>
                <Textarea
                  id="bulkImport"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={"email, name, batch\nstudent1@college.edu, Alice, Batch A"}
                  className="min-h-[160px]"
                />
                <p className="text-xs text-muted-foreground">
                  Supports comma-separated (CSV) and tab-separated data. If only an email is present, name
                  defaults to "Student" and batch to "Batch A".
                </p>
              </div>
              <Button onClick={handleProcessImport} disabled={processingImport} className="w-full md:w-auto">
                {processingImport ? "Processing..." : "Process Import"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

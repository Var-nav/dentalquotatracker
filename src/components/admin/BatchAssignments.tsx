import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Layers, UserPlus, X, Users } from "lucide-react";

interface UserWithBatch {
  id: string;
  email: string;
  full_name: string | null;
  batchId: string | null;
  batchName: string | null;
  userBatchId: string | null;
}

interface Batch {
  id: string;
  name: string;
  academic_year: string | null;
  intake_label: string | null;
}

export function BatchAssignments() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithBatch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkBatch, setBulkBatch] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("id, name, academic_year, intake_label")
        .order("academic_year", { ascending: false })
        .order("name");

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      const { data: userBatches, error: userBatchesError } = await supabase
        .from("user_batches")
        .select("id, user_id, batch_id, batches(name)");

      if (userBatchesError) throw userBatchesError;

      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const usersData: UserWithBatch[] = profiles.map((profile) => {
        const authUser = authUsers?.find((u: any) => u.id === profile.id);
        const userBatch = userBatches.find((ub) => ub.user_id === profile.id);

        return {
          id: profile.id,
          email: authUser?.email || "No email",
          full_name: profile.full_name,
          batchId: userBatch?.batch_id || null,
          batchName: (userBatch?.batches as any)?.name || null,
          userBatchId: userBatch?.id || null,
        };
      });

      setUsers(usersData);
    } catch (error: any) {
      console.error("Failed to load data", error);
      toast({
        title: "Error loading data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchChange = async (userId: string, newBatchId: string) => {
    try {
      setUpdating(userId);

      const user = users.find((u) => u.id === userId);
      if (!user) return;

      if (user.userBatchId) {
        const { error } = await supabase
          .from("user_batches")
          .update({ batch_id: newBatchId })
          .eq("id", user.userBatchId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_batches")
          .insert({ user_id: userId, batch_id: newBatchId });

        if (error) throw error;
      }

      toast({
        title: "Batch assigned",
        description: "User batch assignment updated successfully.",
      });

      await loadData();
    } catch (error: any) {
      console.error("Failed to update batch", error);
      toast({
        title: "Error updating batch",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveBatch = async (userId: string) => {
    try {
      setUpdating(userId);

      const user = users.find((u) => u.id === userId);
      if (!user?.userBatchId) return;

      const { error } = await supabase
        .from("user_batches")
        .delete()
        .eq("id", user.userBatchId);

      if (error) throw error;

      toast({
        title: "Batch removed",
        description: "User batch assignment removed successfully.",
      });

      await loadData();
    } catch (error: any) {
      console.error("Failed to remove batch", error);
      toast({
        title: "Error removing batch",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkBatchAssign = async () => {
    if (!bulkBatch || selectedUsers.size === 0) {
      toast({
        title: "Invalid selection",
        description: "Please select users and a batch to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating("bulk");

      for (const userId of Array.from(selectedUsers)) {
        const user = users.find((u) => u.id === userId);
        if (!user) continue;

        if (user.userBatchId) {
          await supabase
            .from("user_batches")
            .update({ batch_id: bulkBatch })
            .eq("id", user.userBatchId);
        } else {
          await supabase
            .from("user_batches")
            .insert({ user_id: userId, batch_id: bulkBatch });
        }
      }

      const batchName = batches.find((b) => b.id === bulkBatch)?.name;
      toast({
        title: "Bulk batch assignment complete",
        description: `Assigned ${selectedUsers.size} user(s) to ${batchName}.`,
      });

      setSelectedUsers(new Set());
      setBulkBatch("");
      await loadData();
    } catch (error: any) {
      console.error("Failed bulk batch assignment", error);
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
          <p className="text-sm text-muted-foreground">Loading batch assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Batch Assignments
        </CardTitle>
        <CardDescription>Assign users to their respective batches</CardDescription>
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
                <Label className="text-xs">Assign batch to selected users</Label>
                <Select value={bulkBatch} onValueChange={setBulkBatch}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50 max-h-[300px]">
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                        {batch.academic_year && ` - ${batch.academic_year}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleBulkBatchAssign} 
                disabled={updating === "bulk" || !bulkBatch}
                className="shrink-0"
              >
                Assign Batch
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
            id="select-all-batch"
          />
          <Label htmlFor="select-all-batch" className="text-sm font-medium cursor-pointer">
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
                    id={`user-batch-${user.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name || "No name set"}</p>
                      {user.batchName && (
                        <Badge variant="secondary" className="text-xs">
                          <Layers className="h-3 w-3 mr-1" />
                          {user.batchName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Batch:</Label>
                  <Select
                    value={user.batchId || ""}
                    onValueChange={(value) => handleBatchChange(user.id, value)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Assign batch" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50 max-h-[300px]">
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                          {batch.academic_year && ` - ${batch.academic_year}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.batchId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleRemoveBatch(user.id)}
                      disabled={updating === user.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
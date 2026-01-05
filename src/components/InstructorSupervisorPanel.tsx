import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, Search, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProcedures } from "@/hooks/useProcedures";
import { useQuery } from "@tanstack/react-query";

interface PendingProcedure {
  id: string;
  studentName: string;
  taskName: string;
  date: string;
  student_id: string;
  department_id: string;
}

const BATCH_COMPLETION_DATA = [
  { name: "Week 1", batchA: 30, batchB: 25 },
  { name: "Week 2", batchA: 45, batchB: 40 },
  { name: "Week 3", batchA: 65, batchB: 55 },
  { name: "Week 4", batchA: 80, batchB: 70 },
];

const batchChartConfig = {
  batchA: {
    label: "Batch A",
    color: "hsl(var(--primary))",
  },
  batchB: {
    label: "Batch B",
    color: "hsl(var(--secondary))",
  },
} as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;

  const safeQuery = escapeRegExp(query.trim());
  const regex = new RegExp(`(${safeQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span
        key={index}
        className="rounded px-0.5 bg-primary/15 text-primary-foreground"
      >
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function InstructorSupervisorPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateProcedure } = useProcedures();

  const [verifiedToday, setVerifiedToday] = useState(0);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // Get instructor's department
  const { data: instructorProfile } = useQuery({
    queryKey: ["instructor-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("department_id")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get department name
  const { data: department } = useQuery({
    queryKey: ["department", instructorProfile?.department_id],
    queryFn: async () => {
      if (!instructorProfile?.department_id) return null;
      const { data, error } = await supabase
        .from("departments")
        .select("name")
        .eq("id", instructorProfile.department_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!instructorProfile?.department_id,
  });

  // Fetch pending procedures with student names
  const { data: pendingProcedures = [], refetch } = useQuery({
    queryKey: ["pending-procedures", instructorProfile?.department_id],
    queryFn: async () => {
      if (!instructorProfile?.department_id) return [];
      
      const { data: procedures, error } = await supabase
        .from("procedures")
        .select("id, student_id, procedure_type, procedure_date, department_id, quota_task_id")
        .eq("department_id", instructorProfile.department_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student names and task names
      const studentIds = [...new Set(procedures.map(p => p.student_id).filter(Boolean))];
      const taskIds = [...new Set(procedures.map(p => p.quota_task_id).filter(Boolean))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      const { data: tasks } = await supabase
        .from("quota_tasks")
        .select("id, task_name")
        .in("id", taskIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      const taskMap = new Map(tasks?.map(t => [t.id, t.task_name]) || []);

      return procedures.map(p => ({
        id: p.id,
        studentName: profileMap.get(p.student_id!) || "Unknown Student",
        taskName: taskMap.get(p.quota_task_id!) || p.procedure_type,
        date: p.procedure_date,
        student_id: p.student_id!,
        department_id: p.department_id!,
      })) as PendingProcedure[];
    },
    enabled: !!instructorProfile?.department_id,
  });

  const filteredApprovals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pendingProcedures;

    return pendingProcedures.filter((item) => {
      return (
        item.studentName.toLowerCase().includes(query) ||
        item.taskName.toLowerCase().includes(query)
      );
    });
  }, [pendingProcedures, searchTerm]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);

    try {
      await updateProcedure({
        id,
        updates: { status: "verified" },
      });

      setVerifiedToday((count) => count + 1);
      refetch();

      toast({
        title: "Task verified",
        description: "Logbook entry has been marked as verified.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (rejectingId === null || !rejectReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProcedure({
        id: rejectingId,
        updates: { 
          status: "rejected",
          rejection_reason: rejectReason.trim(),
        },
      });

      refetch();
      setRejectDialogOpen(false);

      toast({
        title: "Task rejected",
        description: `Reason: ${rejectReason}`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRejectingId(null);
      setRejectReason("");
    }
  };

  const hasResults = filteredApprovals.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border border-warning/30 bg-gradient-to-br from-card via-warning/5 to-card shadow-soft animate-fade-in">
          <CardHeader className="flex flex-col gap-3 border-b border-border/40 pb-4 sm:gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Instructor Approval Queue
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review and verify student logbook entries in real-time.
                </p>
              </div>

              <Badge className="bg-success/10 text-success-foreground border-success/40 border">
                Tasks verified today:
                <span className="ml-1 font-semibold">{verifiedToday}</span>
              </Badge>
            </div>

            <div className="relative mt-1 flex items-center gap-2">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by student or task name"
                className="pl-9 text-sm bg-background/80 border-border/60 focus-visible:ring-primary/40"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-4">
            {!hasResults ? (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                {pendingProcedures.length === 0
                  ? `No pending verifications for ${department?.name || "your department"}.`
                  : "No approvals match this search. Try a different name."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApprovals.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group flex items-start gap-3 rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in ${
                      verifyingId === item.id
                        ? "animate-scale-out bg-success/10 border-success/40"
                        : ""
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {highlightMatch(item.taskName, searchTerm)}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-warning/40 bg-warning/10 text-warning-foreground"
                        >
                          Pending verification
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Student:{" "}
                        <span className="font-medium text-foreground">
                          {highlightMatch(item.studentName, searchTerm)}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3 text-[11px] text-muted-foreground">
                      <span>{format(new Date(item.date), "MMM d, yyyy")}</span>

                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-success/50 bg-success/10 text-success-foreground hover:bg-success/20"
                          onClick={() => handleVerify(item.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive/10"
                          onClick={() => openRejectDialog(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-primary/30 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Batch Completion Comparison
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track how different batches are progressing towards their quotas.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={batchChartConfig} className="w-full">
              <BarChart data={BATCH_COMPLETION_DATA}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="batchA"
                  fill="var(--color-batchA)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="batchB"
                  fill="var(--color-batchB)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>Reject logbook entry</DialogTitle>
            <DialogDescription>
              Provide a clear reason so the student knows what needs to be corrected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label
              htmlFor="reject-reason"
              className="text-sm font-medium text-foreground"
            >
              Rejection reason
            </label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Incomplete documentation, please attach pre-op radiograph."
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim()}
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

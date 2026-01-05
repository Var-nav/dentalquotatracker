import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Filter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TaskStatus = "pending" | "verified" | "rejected";

interface LogTask {
  id: string;
  procedure: string;
  status: TaskStatus;
  date: string;
  rejection_reason?: string | null;
}

export function StudentLogbook() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [open, setOpen] = useState(false);

  // Fetch student's procedures
  const { data: procedures = [], refetch } = useQuery({
    queryKey: ["student-procedures", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("procedures")
        .select("id, procedure_type, status, procedure_date, rejection_reason, quota_task_id")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch task names for procedures
      const taskIds = [...new Set(data.map(p => p.quota_task_id).filter(Boolean))];
      const { data: tasks } = await supabase
        .from("quota_tasks")
        .select("id, task_name")
        .in("id", taskIds);

      const taskMap = new Map(tasks?.map(t => [t.id, t.task_name]) || []);

      return data.map(p => ({
        id: p.id,
        procedure: taskMap.get(p.quota_task_id!) || p.procedure_type,
        status: (p.status || "pending") as TaskStatus,
        date: p.procedure_date,
        rejection_reason: p.rejection_reason,
      })) as LogTask[];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const completed = procedures.filter((t) => t.status === "verified").length;
    const pending = procedures.filter((t) => t.status === "pending").length;
    const REQUIRED_TOTAL = 10; // This could come from quota targets
    return {
      required: REQUIRED_TOTAL,
      completed,
      pending,
      inProgress: pending,
      progress: Math.min(100, (completed / REQUIRED_TOTAL) * 100),
    };
  }, [procedures]);

  const visibleTasks = useMemo(
    () => (filter === "pending" ? procedures.filter((t) => t.status === "pending") : procedures),
    [filter, procedures]
  );

  const statusBadgeClasses: Record<TaskStatus, string> = {
    pending: "bg-blue-500/10 text-blue-600 border-blue-500/40 dark:text-blue-400",
    verified: "bg-success/10 text-success-foreground border-success/40",
    rejected: "bg-destructive/10 text-destructive-foreground border-destructive/40",
  };

  const statusLabel: Record<TaskStatus, string> = {
    pending: "In Progress",
    verified: "Completed",
    rejected: "Rejected",
  };

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft backdrop-blur-sm animate-fade-in">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg sm:text-xl">Student Logbook</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick view of your latest clinical entries and quota progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-2 py-1 transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-full px-2 py-1 transition-colors ${
                filter === "pending"
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              In Progress
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {stats.completed} of {stats.required} required procedures completed
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {stats.inProgress} in progress
            </span>
          </div>
          <Progress value={stats.progress} className="h-2 overflow-hidden" />
        </div>

        <div className="flex items-center justify-between gap-3 sm:hidden text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-2 py-1 border text-[11px] ${
                filter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Show all
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-full px-2 py-1 border text-[11px] ${
                filter === "pending"
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-border text-muted-foreground"
              }`}
            >
              In Progress
            </button>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            No entries to show yet. Add your first logbook entry to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task, index) => (
              <div
                key={task.id}
                className="group rounded-lg border border-border/60 bg-background/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {task.procedure}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`${statusBadgeClasses[task.status]} border`}
                      >
                        {statusLabel[task.status]}
                      </Badge>
                    </div>
                    {task.rejection_reason && (
                      <p className="text-xs text-destructive">
                        Rejection: {task.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                    <span>{format(new Date(task.date), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

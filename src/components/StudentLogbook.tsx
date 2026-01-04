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

 type TaskStatus = "pending" | "verified" | "rejected";

 interface LogTask {
  id: number;
  patientId: string;
  procedure: string;
  status: TaskStatus;
  date: string;
}

const INITIAL_TASKS: LogTask[] = [
  {
    id: 3,
    patientId: "CD-304",
    procedure: "Complete Denture",
    status: "verified",
    date: new Date().toISOString(),
  },
  {
    id: 2,
    patientId: "RC-212",
    procedure: "Root Canal (Mandibular Molar)",
    status: "pending",
    date: new Date().toISOString(),
  },
  {
    id: 1,
    patientId: "EX-118",
    procedure: "Simple Extraction",
    status: "rejected",
    date: new Date().toISOString(),
  },
];

const REQUIRED_TOTAL = 10;

export function StudentLogbook() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<LogTask[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [open, setOpen] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [procedure, setProcedure] = useState("");

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "verified").length;
    return {
      required: REQUIRED_TOTAL,
      completed,
      pending: tasks.length - completed,
      progress: Math.min(100, (completed / REQUIRED_TOTAL) * 100),
    };
  }, [tasks]);

  const visibleTasks = useMemo(
    () => (filter === "pending" ? tasks.filter((t) => t.status === "pending") : tasks),
    [filter, tasks]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!patientId.trim() || !procedure.trim()) {
      toast({
        title: "Missing details",
        description: "Please fill in both Patient ID and Procedure.",
        variant: "destructive",
      });
      return;
    }

    const newTask: LogTask = {
      id: Date.now(),
      patientId: patientId.trim(),
      procedure: procedure.trim(),
      status: "pending",
      date: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    setPatientId("");
    setProcedure("");
    setOpen(false);

    toast({
      title: "Entry added",
      description: "New logbook entry created successfully.",
    });
  };

  const statusBadgeClasses: Record<TaskStatus, string> = {
    pending: "bg-warning/10 text-warning-foreground border-warning/40",
    verified: "bg-success/10 text-success-foreground border-success/40",
    rejected: "bg-destructive/10 text-destructive-foreground border-destructive/40",
  };

  const statusLabel: Record<TaskStatus, string> = {
    pending: "Pending",
    verified: "Verified",
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
                  ? "bg-warning text-warning-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              Pending only
            </button>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="hover-scale">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md animate-scale-in">
              <DialogHeader>
                <DialogTitle>Add logbook entry</DialogTitle>
                <DialogDescription>
                  Capture a new clinical procedure. You can update status later once verified.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="patientId">
                    Patient ID
                  </label>
                  <Input
                    id="patientId"
                    placeholder="e.g. AB-104"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="procedure">
                    Procedure
                  </label>
                  <Input
                    id="procedure"
                    placeholder="e.g. Complete Denture"
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {stats.completed} of {stats.required} required procedures verified
            </span>
            <span className="font-medium text-foreground">
              {stats.pending} pending
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
                  ? "border-warning bg-warning/10 text-warning-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              Pending only
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
                    <p className="text-xs text-muted-foreground">
                      Patient ID: <span className="font-medium text-foreground">{task.patientId}</span>
                    </p>
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

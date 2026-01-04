import { useState } from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface ApprovalRequest {
  id: number;
  studentName: string;
  taskName: string;
  date: string;
  patientId: string;
}

const INITIAL_PENDING_APPROVALS: ApprovalRequest[] = [
  {
    id: 1,
    studentName: "Ayesha Khan",
    taskName: "Complete Denture",
    date: new Date().toISOString(),
    patientId: "CD-304",
  },
  {
    id: 2,
    studentName: "Rahul Mehta",
    taskName: "Root Canal (Mandibular Molar)",
    date: new Date().toISOString(),
    patientId: "RC-212",
  },
  {
    id: 3,
    studentName: "Sara Lee",
    taskName: "Simple Extraction",
    date: new Date().toISOString(),
    patientId: "EX-118",
  },
  {
    id: 4,
    studentName: "James Wong",
    taskName: "Scaling & Polishing",
    date: new Date().toISOString(),
    patientId: "SP-087",
  },
];

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

export function InstructorSupervisorPanel() {
  const { toast } = useToast();

  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    INITIAL_PENDING_APPROVALS,
  );
  const [verifiedToday, setVerifiedToday] = useState(0);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleVerify = (id: number) => {
    setVerifyingId(id);

    setTimeout(() => {
      setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
      setVerifiedToday((count) => count + 1);
      setVerifyingId(null);

      toast({
        title: "Task verified",
        description: "Logbook entry has been marked as verified.",
      });
    }, 260);
  };

  const openRejectDialog = (id: number) => {
    setRejectingId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (rejectingId === null) return;

    setPendingApprovals((prev) => prev.filter((item) => item.id !== rejectingId));
    setRejectDialogOpen(false);

    toast({
      title: "Task rejected",
      description: rejectReason
        ? `Reason: ${rejectReason}`
        : "The task has been rejected.",
      variant: "destructive",
    });

    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border border-warning/30 bg-gradient-to-br from-card via-warning/5 to-card shadow-soft animate-fade-in">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Instructor Approval Queue
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review and verify student logbook entries in real-time.
              </p>
            </div>

            <Badge className="bg-success/10 text-success-foreground border-success/40 border">
              Tasks verified today: <span className="ml-1 font-semibold">{verifiedToday}</span>
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No pending approvals. Enjoy your coffee break!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group flex items-start gap-3 rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in ${
                      verifyingId === item.id ? "animate-scale-out bg-success/10 border-success/40" : ""
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {item.taskName}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-warning/40 bg-warning/10 text-warning-foreground"
                        >
                          Pending verification
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Student: <span className="font-medium text-foreground">{item.studentName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Patient ID: <span className="font-medium text-foreground">{item.patientId}</span>
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
              Add an optional note so the student knows exactly what to fix.
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
            <Button type="button" variant="destructive" onClick={handleConfirmReject}>
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

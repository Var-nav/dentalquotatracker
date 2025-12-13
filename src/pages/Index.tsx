import { useMemo, useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressCharts } from "@/components/ProgressCharts";
import { ProcedureCalendar } from "@/components/ProcedureCalendar";
import { EditProcedureDialog } from "@/components/EditProcedureDialog";
import { useToast } from "@/hooks/use-toast";
import { useProcedures, ProcedureType, Procedure } from "@/hooks/useProcedures";
import { useQuotaTargets } from "@/hooks/useQuotaTargets";
import { Pencil, Trash2 } from "lucide-react";

const PROCEDURE_TYPES: ProcedureType[] = ["Restorations", "Extractions", "Root Canals"];

const INITIAL_TARGETS: Record<ProcedureType, number> = {
  Restorations: 40,
  Extractions: 50,
  "Root Canals": 25,
};

const Index = () => {
  const { toast } = useToast();

  const { procedures, isLoading: proceduresLoading, addProcedure, updateProcedure, deleteProcedure } = useProcedures();
  const { targets, isLoading: targetsLoading, updateTarget } = useQuotaTargets();

  const [patientName, setPatientName] = useState("");
  const [procedureType, setProcedureType] = useState<ProcedureType | "">("");
  const [date, setDate] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState("");

  const [editingTargets, setEditingTargets] = useState<Record<ProcedureType, number>>(INITIAL_TARGETS);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Sync editingTargets with backend targets on load
  useMemo(() => {
    if (targets.length > 0) {
      const backendTargets = targets.reduce(
        (acc, t) => ({ ...acc, [t.procedure_type]: t.target }),
        {} as Record<ProcedureType, number>
      );
      setEditingTargets((prev) => ({ ...prev, ...backendTargets }));
    }
  }, [targets]);

  const stats = useMemo(() => {
    const counts: Record<ProcedureType, number> = {
      Restorations: 0,
      Extractions: 0,
      "Root Canals": 0,
    };

    for (const entry of procedures) {
      counts[entry.procedure_type as ProcedureType]++;
    }

    return counts;
  }, [procedures]);

  const targetsMap = useMemo(() => {
    return targets.reduce(
      (acc, t) => ({ ...acc, [t.procedure_type]: t.target }),
      INITIAL_TARGETS
    );
  }, [targets]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim() || !procedureType || !date || !supervisorName.trim()) {
      toast({
        title: "Missing information",
        description: "Please complete all fields before adding a case.",
      });
      return;
    }

    try {
      await addProcedure({
        patient_name: patientName.trim(),
        procedure_type: procedureType as ProcedureType,
        procedure_date: date,
        supervisor_name: supervisorName.trim(),
      });

      setPatientName("");
      setProcedureType("");
      setDate("");
      setSupervisorName("");

      toast({
        title: "Case added",
        description: `${procedureType} for ${patientName.trim()} recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error adding case",
        description: "Could not save the case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTargetChange = (type: ProcedureType, value: string) => {
    const numeric = Number(value.replace(/[^0-9]/g, ""));
    if (Number.isNaN(numeric)) return;

    setEditingTargets((prev) => ({
      ...prev,
      [type]: numeric,
    }));
  };

  const handleSaveTargets = async () => {
    try {
      const sanitized: Record<ProcedureType, number> = { ...editingTargets };
      (Object.keys(sanitized) as ProcedureType[]).forEach((key) => {
        if (!sanitized[key] || sanitized[key] < 1) {
          sanitized[key] = 1;
        }
      });

      await Promise.all(
        (Object.keys(sanitized) as ProcedureType[]).map((type) =>
          updateTarget({ procedure_type: type, target: sanitized[type] })
        )
      );

      toast({
        title: "Goals updated",
        description: "Clinical quota targets have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating goals",
        description: "Could not save goals. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProcedure = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    updates: Partial<Omit<Procedure, "id" | "created_at">>
  ) => {
    try {
      await updateProcedure({ id, updates });
      toast({
        title: "Case updated",
        description: "Procedure has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating case",
        description: "Could not update the case. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteProcedure = async (id: string, patientName: string) => {
    try {
      await deleteProcedure(id);
      toast({
        title: "Case deleted",
        description: `Procedure for ${patientName} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting case",
        description: "Could not delete the case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = proceduresLoading || targetsLoading;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--medical-bg))/80%,_hsl(var(--background)))] text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: "Dental Clinical Quota Dashboard",
            description:
              "Dashboard for dental students to track clinical quotas for restorations, extractions, and root canals.",
            educationalCredentialAwarded: "DDS Clinical Requirements",
            provider: {
              "@type": "CollegeOrUniversity",
              name: "Dental School",
            },
          }),
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Clinical tracker
            </p>
            <h1 className="bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-primary to-[hsl(var(--accent-strong))]">
              Dental Clinical Quota Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Log every patient, watch your requirements fill in real time, and stay ahead of
              graduation deadlines.
            </p>
          </div>
          <div className="hidden shrink-0 items-center rounded-full border bg-card/80 px-4 py-2 text-xs shadow-soft md:flex">
            <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--accent-strong))]" />
            <span className="font-medium">Today&apos;s progress</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,_3fr)_minmax(280px,_2fr)] lg:grid-cols-[minmax(0,_3.2fr)_minmax(320px,_2fr)]">
          <section className="space-y-4">
            <Card className="relative overflow-hidden border border-primary/10 bg-card/80 shadow-soft backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[hsl(var(--primary-soft))] opacity-40 blur-3xl" />
              <CardHeader className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base sm:text-lg">Quota overview</CardTitle>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Tap a bar to see counts and adjust goals on the right.
                </p>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                {isLoading ? (
                  <div className="text-center text-sm text-muted-foreground">Loading...</div>
                ) : (
                  PROCEDURE_TYPES.map((type) => {
                    const count = stats[type];
                    const target = targetsMap[type] || 1;
                    const percent = Math.min(100, Math.round((count / target) * 100));

                    return (
                      <button
                        key={type}
                        type="button"
                        className="group flex w-full flex-col gap-1 rounded-lg border border-border/60 bg-background/60 p-3 text-left transition-[transform,box-shadow,background]
                                   hover:-translate-y-[1px] hover:bg-background/90 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center justify-between text-xs font-medium sm:text-sm">
                          <span>{type}</span>
                          <span className="text-muted-foreground">
                            {count} / {target} cases
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <Progress
                            value={percent}
                            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                          />
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {percent}%
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Case history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-4 text-center text-xs text-muted-foreground sm:text-sm">
                    Loading your cases...
                  </div>
                ) : procedures.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-4 text-center text-xs text-muted-foreground sm:text-sm">
                    Your recent procedures will appear here. Start by adding a case on the right.
                  </div>
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {procedures.map((entry) => (
                      <div
                        key={entry.id}
                        className="group flex items-center gap-2 rounded-md border border-border/60 bg-background/80 p-3 text-xs transition-colors hover:bg-background sm:text-sm"
                      >
                        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium text-foreground">{entry.patient_name}</div>
                            <div className="mt-0.5 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                              {entry.procedure_type}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground sm:text-xs">
                            <span>
                              {format(new Date(entry.procedure_date), "MMM d, yyyy")} ·{" "}
                              {entry.supervisor_name}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditProcedure(entry)}
                            title="Edit case"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteProcedure(entry.id, entry.patient_name)}
                            title="Delete case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="border border-primary/10 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Add patient case</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEntry} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="patientName">Patient name</Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. J. Smith"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Procedure type</Label>
                    <Select
                      value={procedureType || ""}
                      onValueChange={(value) => setProcedureType(value as ProcedureType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select procedure" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROCEDURE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="supervisorName">Supervisor</Label>
                    <Input
                      id="supervisorName"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="e.g. Dr. Patel"
                      autoComplete="off"
                    />
                  </div>

                  <Button type="submit" className="mt-1 w-full" disabled={isLoading}>
                    Log case
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quota goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Adjust your target number of cases for each category to match your school or
                  clinic requirements.
                </p>

                <div className="space-y-2">
                  {PROCEDURE_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-3">
                      <Label className="min-w-[6.5rem] text-xs sm:min-w-[7rem] sm:text-sm">
                        {type}
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={editingTargets[type]?.toString() || ""}
                        onChange={(e) => handleTargetChange(type, e.target.value)}
                        className="h-8 flex-1 text-xs sm:h-9 sm:text-sm"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveTargets}
                  disabled={isLoading}
                >
                  Save goals
                </Button>
              </CardContent>
            </Card>
          </section>
          </div>

          <ProgressCharts procedures={procedures} targets={targetsMap} />

          <ProcedureCalendar procedures={procedures} />
        </main>

        <EditProcedureDialog
          procedure={editingProcedure}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEdit}
        />

        <footer className="mt-6 flex items-center justify-between gap-4 border-t pt-3 text-[0.7rem] text-muted-foreground sm:text-xs">
          <p>Designed for dental students tracking real clinical progress.</p>
          <p className="hidden sm:block">Tip: Rotate your phone for a wider dashboard view.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

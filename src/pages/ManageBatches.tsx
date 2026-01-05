import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BatchRow {
  id: string;
  name: string;
  year_of_study: string | null;
  academic_year: string | null;
  intake_label: string | null;
}


const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  year_of_study: z.string().min(1, "Year of study is required"),
  academic_year: z.string().min(1, "Academic year is required"),
  intake_label: z.enum(["Aug batch", "Feb batch"]),
});

const ManageBatchesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd year");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [intakeLabel, setIntakeLabel] = useState<"Aug batch" | "Feb batch">("Aug batch");

  const [editingBatch, setEditingBatch] = useState<BatchRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editYearOfStudy, setEditYearOfStudy] = useState("");
  const [editAcademicYear, setEditAcademicYear] = useState("");
  const [editIntakeLabel, setEditIntakeLabel] = useState<"Aug batch" | "Feb batch">("Aug batch");
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("id, name, year_of_study, academic_year, intake_label")
          .order("academic_year", { ascending: false })
          .order("intake_label")
          .order("name");

        if (error) throw error;
        setBatches(data ?? []);
      } catch (err) {
        console.error("Failed to load batches", err);
        toast({
          title: "Error loading batches",
          description: "Please refresh the page or try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

const handleCreate = async () => {
  if (!user) {
    toast({
      title: "Not signed in",
      description: "You must be logged in to create batches.",
      variant: "destructive",
    });
    return;
  }

  const parsed = batchSchema.safeParse({
    name,
    year_of_study: yearOfStudy,
    academic_year: academicYear,
    intake_label: intakeLabel,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    toast({
      title: "Invalid details",
      description: firstError,
      variant: "destructive",
    });
    return;
  }

  try {
    setSaving(true);
    const payload = { ...parsed.data, user_id: user.id } as any;
    const { data, error } = await supabase
      .from("batches")
      .insert([payload])
      .select("id, name, year_of_study, academic_year, intake_label")
      .single();

    if (error) throw error;

    setBatches((prev) => [data as BatchRow, ...prev]);
    setName("");
    toast({
      title: "Batch created",
      description: "New batch added for this academic year.",
    });
  } catch (err: any) {
    console.error("Failed to create batch", err);
    const isRlsError = err?.message?.includes("row violates row-level security policy");
    toast({
      title: "Could not create batch",
      description: isRlsError
        ? "You don't have permission to create batches. Please make sure you're logged in with the correct account."
        : err?.message ?? "Please try again.",
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};

  const handleEditClick = (batch: BatchRow) => {
    setEditingBatch(batch);
    setEditName(batch.name);
    setEditYearOfStudy(batch.year_of_study || "");
    setEditAcademicYear(batch.academic_year || "");
    setEditIntakeLabel((batch.intake_label as "Aug batch" | "Feb batch") || "Aug batch");
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    const parsed = batchSchema.safeParse({
      name: editName,
      year_of_study: editYearOfStudy,
      academic_year: editAcademicYear,
      intake_label: editIntakeLabel,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      toast({
        title: "Invalid details",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("batches")
        .update(parsed.data)
        .eq("id", editingBatch.id);

      if (error) throw error;

      setBatches((prev) =>
        prev.map((b) =>
          b.id === editingBatch.id
            ? { ...b, ...parsed.data }
            : b
        )
      );
      setEditingBatch(null);
      toast({
        title: "Batch updated",
        description: "Batch details have been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update batch", err);
      toast({
        title: "Could not update batch",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deletingBatchId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", deletingBatchId);

      if (error) throw error;

      setBatches((prev) => prev.filter((b) => b.id !== deletingBatchId));
      setDeletingBatchId(null);
      toast({
        title: "Batch deleted",
        description: "Batch has been removed successfully.",
      });
    } catch (err: any) {
      console.error("Failed to delete batch", err);
      toast({
        title: "Could not delete batch",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedByYear = batches.reduce<Record<string, BatchRow[]>>((acc, b) => {
    const key = b.academic_year || "Academic year not set";
    acc[key] = acc[key] || [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            Manage Batches
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Define sub-batches (like H batch) under Aug/Feb main intakes for each academic year.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Sub-batch name</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch (A-Z)" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50 max-h-[300px]">
                <Collapsible>
                  <CollapsibleTrigger className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent rounded flex items-center justify-between">
                    <span>Batch A - M</span>
                    <ChevronDown className="h-3 w-3" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {Array.from({ length: 13 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                      <SelectItem key={letter} value={`Batch ${letter}`}>
                        Batch {letter}
                      </SelectItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible>
                  <CollapsibleTrigger className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent rounded flex items-center justify-between">
                    <span>Batch N - Z</span>
                    <ChevronDown className="h-3 w-3" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {Array.from({ length: 13 }, (_, i) => String.fromCharCode(78 + i)).map((letter) => (
                      <SelectItem key={letter} value={`Batch ${letter}`}>
                        Batch {letter}
                      </SelectItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year of study</Label>
            <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="3rd year">3rd year</SelectItem>
                <SelectItem value="Final year">Final year</SelectItem>
                <SelectItem value="CRRI">CRRI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Academic year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2026-2027">2026-2027</SelectItem>
                <SelectItem value="2027-2028">2027-2028</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Main intake</Label>
            <Select
              value={intakeLabel}
              onValueChange={(v) => setIntakeLabel(v as "Aug batch" | "Feb batch")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="Aug batch">Aug batch</SelectItem>
                <SelectItem value="Feb batch">Feb batch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleCreate} disabled={saving}>
              {saving ? "Adding..." : "Add batch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Existing batches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading batches...</p>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No batches yet. Create Aug and Feb batches for the current academic year above.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByYear).map(([academicYearKey, yearBatches]) => {
                const intakes = yearBatches.reduce<Record<string, BatchRow[]>>((acc, b) => {
                  const key = b.intake_label || "Unlabelled intake";
                  acc[key] = acc[key] || [];
                  acc[key].push(b);
                  return acc;
                }, {});

                return (
                  <div key={academicYearKey} className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {academicYearKey}
                    </p>
                    {Object.entries(intakes).map(([intakeKey, intakeBatches]) => {
                      const years = intakeBatches.reduce<Record<string, BatchRow[]>>((acc, b) => {
                        const key = b.year_of_study || "Year not set";
                        acc[key] = acc[key] || [];
                        acc[key].push(b);
                        return acc;
                      }, {});

                      return (
                        <div key={intakeKey} className="space-y-2 pl-2 border-l border-border/60">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {intakeKey}
                          </p>
                          <div className="space-y-1">
                            {Object.entries(years).map(([yearKey, yearBatchesForIntake]) => (
                              <Collapsible key={yearKey} className="border border-border/40 rounded-md bg-card/60">
                                <CollapsibleTrigger asChild>
                                  <button
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:bg-accent/40 transition-colors data-[state=open]:text-foreground"
                                  >
                                    <span>{yearKey}</span>
                                    <span className="flex items-center gap-2 text-[10px] font-normal">
                                      {yearBatchesForIntake.length} sub-batch
                                      {yearBatchesForIntake.length !== 1 ? "es" : ""}
                                      <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
                                    </span>
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                   <ul className="text-sm text-foreground grid gap-1 md:grid-cols-2 px-3 pb-3 pt-1">
                                    {yearBatchesForIntake.map((b) => (
                                      <li
                                        key={b.id}
                                        className="rounded-lg border border-border/60 bg-card px-3 py-2 flex items-center justify-between group hover:border-primary/30 transition-colors"
                                      >
                                        <span className="font-medium">{b.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => handleEditClick(b)}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setDeletingBatchId(b.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update the batch details below. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Sub-batch name</Label>
              <Select value={editName} onValueChange={setEditName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch (A-Z)" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50 max-h-[300px]">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent rounded flex items-center justify-between">
                      <span>Batch A - M</span>
                      <ChevronDown className="h-3 w-3" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {Array.from({ length: 13 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                        <SelectItem key={letter} value={`Batch ${letter}`}>
                          Batch {letter}
                        </SelectItem>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible>
                    <CollapsibleTrigger className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent rounded flex items-center justify-between">
                      <span>Batch N - Z</span>
                      <ChevronDown className="h-3 w-3" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {Array.from({ length: 13 }, (_, i) => String.fromCharCode(78 + i)).map((letter) => (
                        <SelectItem key={letter} value={`Batch ${letter}`}>
                          Batch {letter}
                        </SelectItem>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year of study</Label>
              <Select value={editYearOfStudy} onValueChange={setEditYearOfStudy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="3rd year">3rd year</SelectItem>
                  <SelectItem value="Final year">Final year</SelectItem>
                  <SelectItem value="CRRI">CRRI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Select value={editAcademicYear} onValueChange={setEditAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                  <SelectItem value="2027-2028">2027-2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Main intake</Label>
              <Select
                value={editIntakeLabel}
                onValueChange={(v) => setEditIntakeLabel(v as "Aug batch" | "Feb batch")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intake" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="Aug batch">Aug batch</SelectItem>
                  <SelectItem value="Feb batch">Feb batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBatch} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBatchId} onOpenChange={(open) => !open && setDeletingBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this batch. This action cannot be undone.
              Students assigned to this batch will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageBatchesPage;

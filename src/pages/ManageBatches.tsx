import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd year");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [intakeLabel, setIntakeLabel] = useState<"Aug batch" | "Feb batch">("Aug batch");

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
      const payload = parsed.data as any;
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
      toast({
        title: "Could not create batch",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const grouped = batches.reduce<Record<string, BatchRow[]>>((acc, b) => {
    const key = `${b.academic_year ?? "Unknown"} • ${b.intake_label ?? "Unlabelled"}`;
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="H batch"
            />
          </div>
          <div className="space-y-2">
            <Label>Year of study</Label>
            <Input
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              placeholder="3rd year"
            />
          </div>
          <div className="space-y-2">
            <Label>Academic year</Label>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024-2025"
            />
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
              {Object.entries(grouped).map(([groupKey, groupBatches]) => (
                <div key={groupKey} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupKey}
                  </p>
                  <ul className="text-sm text-foreground grid gap-1 md:grid-cols-2">
                    {groupBatches.map((b) => (
                      <li
                        key={b.id}
                        className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 flex items-center justify-between"
                      >
                        <span className="font-medium">{b.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {b.year_of_study || "Year not set"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageBatchesPage;

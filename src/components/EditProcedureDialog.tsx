import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Procedure, ProcedureType } from "@/hooks/useProcedures";

interface EditProcedureDialogProps {
  procedure: Procedure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Omit<Procedure, "id" | "created_at">>) => Promise<void>;
}

const PROCEDURE_TYPES: ProcedureType[] = ["Restorations", "Extractions", "Root Canals"];

export const EditProcedureDialog = ({
  procedure,
  open,
  onOpenChange,
  onSave,
}: EditProcedureDialogProps) => {
  const [patientName, setPatientName] = useState("");
  const [procedureType, setProcedureType] = useState<ProcedureType | "">("");
  const [date, setDate] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (procedure) {
      setPatientName(procedure.patient_name);
      setProcedureType(procedure.procedure_type as ProcedureType);
      setDate(procedure.procedure_date);
      setSupervisorName(procedure.supervisor_name);
    }
  }, [procedure]);

  const handleSave = async () => {
    if (!procedure || !patientName.trim() || !procedureType || !date || !supervisorName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(procedure.id, {
        patient_name: patientName.trim(),
        procedure_type: procedureType,
        procedure_date: date,
        supervisor_name: supervisorName.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit procedure</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-patientName">Patient name</Label>
            <Input
              id="edit-patientName"
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
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-supervisorName">Supervisor</Label>
            <Input
              id="edit-supervisorName"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Dr. Patel"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

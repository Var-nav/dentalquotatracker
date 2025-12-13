import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isSameDay } from "date-fns";
import { Procedure, ProcedureType } from "@/hooks/useProcedures";
import { cn } from "@/lib/utils";

interface ProcedureCalendarProps {
  procedures: Procedure[];
}

const PROCEDURE_COLORS: Record<ProcedureType, string> = {
  Restorations: "bg-primary",
  Extractions: "bg-[hsl(var(--accent))]",
  "Root Canals": "bg-[hsl(var(--accent-strong))]",
};

export const ProcedureCalendar = ({ procedures }: ProcedureCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Group procedures by date
  const proceduresByDate = useMemo(() => {
    const dateMap = new Map<string, Procedure[]>();

    procedures.forEach((proc) => {
      const dateKey = format(new Date(proc.procedure_date), "yyyy-MM-dd");
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(proc);
    });

    return dateMap;
  }, [procedures]);

  // Get procedures for selected date
  const selectedDateProcedures = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return proceduresByDate.get(dateKey) || [];
  }, [selectedDate, proceduresByDate]);

  // Get procedure types for a given date
  const getProcedureTypes = (date: Date): ProcedureType[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    const procs = proceduresByDate.get(dateKey) || [];
    const types = new Set<ProcedureType>();
    procs.forEach((p) => types.add(p.procedure_type as ProcedureType));
    return Array.from(types);
  };

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dateKey = format(date, "yyyy-MM-dd");
    if (proceduresByDate.has(dateKey)) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden border border-primary/10 bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[hsl(var(--primary-soft))] opacity-30 blur-3xl" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-base sm:text-lg">Procedure calendar</CardTitle>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Click any highlighted day to see logged cases
          </p>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col gap-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              className="rounded-md border"
              modifiers={{
                hasProcedures: (date) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  return proceduresByDate.has(dateKey);
                },
              }}
              modifiersClassNames={{
                hasProcedures: "font-bold",
              }}
              components={{
                DayContent: ({ date, ...props }) => {
                  const types = getProcedureTypes(date);
                  const dateKey = format(date, "yyyy-MM-dd");
                  const hasProcs = proceduresByDate.has(dateKey);

                  return (
                    <div className="relative flex h-full w-full flex-col items-center justify-center">
                      <span {...props}>{format(date, "d")}</span>
                      {hasProcs && (
                        <div className="absolute bottom-0.5 flex gap-0.5">
                          {types.map((type) => (
                            <div
                              key={type}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                PROCEDURE_COLORS[type]
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />

            <div className="flex flex-wrap gap-3 rounded-md border border-border/60 bg-background/60 p-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Restorations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
                <span className="text-muted-foreground">Extractions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--accent-strong))]" />
                <span className="text-muted-foreground">Root Canals</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Cases on {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDateProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No procedures logged for this day.</p>
            ) : (
              selectedDateProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/80 p-3"
                >
                  <div
                    className={cn(
                      "mt-0.5 h-3 w-3 shrink-0 rounded-full",
                      PROCEDURE_COLORS[proc.procedure_type as ProcedureType]
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{proc.patient_name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {proc.procedure_type}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Supervised by {proc.supervisor_name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

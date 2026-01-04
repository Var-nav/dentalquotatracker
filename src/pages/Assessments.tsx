import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AssessmentsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const selectedKey = useMemo(
    () => (selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined),
    [selectedDate],
  );

  const hasPendingOnSelected = selectedKey ? pendingSlots.has(selectedKey) : false;

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedDate) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    setPendingSlots((prev) => new Set(prev).add(key));
    setDialogOpen(false);
  };

  const isPending = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return pendingSlots.has(key);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
          Assessments
        </h1>
        <p className="text-muted-foreground mt-2">
          Plan clinical assessments and track pending booking requests.
        </p>
      </div>

      <Card className="border border-primary/30 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Assessment booking calendar</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Tap a date to request an assessment slot. Bookings are mock-only for now.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                viewMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                viewMode === "week"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              Weekly
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            className="rounded-md border transition-all duration-300"
            modifiers={{
              pending: (date) => isPending(date),
            }}
            modifiersClassNames={{
              pending: "font-semibold text-primary",
            }}
            components={{
              DayContent: ({ date, ...props }) => {
                const pending = isPending(date);

                return (
                  <div className="relative flex h-full w-full flex-col items-center justify-center">
                    <span {...props}>{format(date, "d")}</span>
                    {pending && (
                      <span className="mt-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-medium text-warning-foreground">
                        Booking pending
                      </span>
                    )}
                  </div>
                );
              },
            }}
          />

          <div className="flex flex-wrap gap-3 rounded-md border border-border/60 bg-background/70 p-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">Booking pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-border" />
              <span className="text-muted-foreground">No booking yet</span>
            </div>
          </div>

          {selectedDate && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">
                Selected date:
                <span className="ml-1 font-medium text-foreground">
                  {format(selectedDate, "EEEE, MMM d, yyyy")}
                </span>
              </span>
              {hasPendingOnSelected && (
                <Badge className="bg-warning/15 text-warning-foreground border-warning/40">
                  Booking pending
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>Request assessment slot</DialogTitle>
            <DialogDescription>
              This is a frontend-only flow. In the next step, we will connect it to the
              backend.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              You are requesting a slot on:
            </p>
            <p className="font-medium text-foreground">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmBooking}>
              Request slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentsPage;

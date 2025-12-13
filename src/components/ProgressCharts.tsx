import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfWeek, addDays, differenceInDays, addWeeks } from "date-fns";
import { Procedure, ProcedureType } from "@/hooks/useProcedures";

interface ProgressChartsProps {
  procedures: Procedure[];
  targets: Record<ProcedureType, number>;
}

const PROCEDURE_TYPES: ProcedureType[] = ["Restorations", "Extractions", "Root Canals"];

const CHART_COLORS = {
  Restorations: "hsl(var(--green))",
  Extractions: "hsl(var(--orange))",
  "Root Canals": "hsl(var(--purple))",
};

export const ProgressCharts = ({ procedures, targets }: ProgressChartsProps) => {
  const { weeklyData, projections } = useMemo(() => {
    // Group procedures by week
    const weekMap = new Map<string, Record<ProcedureType, number>>();

    procedures.forEach((proc) => {
      const weekStart = startOfWeek(new Date(proc.procedure_date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "MMM d");

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          Restorations: 0,
          Extractions: 0,
          "Root Canals": 0,
        });
      }

      const weekData = weekMap.get(weekKey)!;
      weekData[proc.procedure_type as ProcedureType]++;
    });

    // Sort weeks chronologically and calculate cumulative
    const sortedWeeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => {
        const dateA = new Date(a + ", " + new Date().getFullYear());
        const dateB = new Date(b + ", " + new Date().getFullYear());
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Last 12 weeks

    const weeklyChartData = sortedWeeks.map(([week, counts]) => ({
      week,
      ...counts,
    }));

    // Calculate cumulative data
    const cumulative: Record<ProcedureType, number> = {
      Restorations: 0,
      Extractions: 0,
      "Root Canals": 0,
    };

    const cumulativeData = sortedWeeks.map(([week, counts]) => {
      PROCEDURE_TYPES.forEach((type) => {
        cumulative[type] += counts[type];
      });

      return {
        week,
        Restorations: cumulative.Restorations,
        Extractions: cumulative.Extractions,
        "Root Canals": cumulative["Root Canals"],
      };
    });

    // Calculate projections
    const now = new Date();
    const firstProcedure = procedures.length > 0
      ? new Date(
          Math.min(
            ...procedures.map((p) => new Date(p.procedure_date).getTime())
          )
        )
      : now;

    const daysSinceStart = Math.max(1, differenceInDays(now, firstProcedure));

    const projectionsList = PROCEDURE_TYPES.map((type) => {
      const completed = procedures.filter((p) => p.procedure_type === type).length;
      const target = targets[type] || 1;
      const remaining = Math.max(0, target - completed);
      const rate = completed / daysSinceStart; // procedures per day

      let projectedDate = "On track";
      let weeksRemaining = 0;

      if (rate > 0 && remaining > 0) {
        const daysToComplete = Math.ceil(remaining / rate);
        const completionDate = addDays(now, daysToComplete);
        projectedDate = format(completionDate, "MMM d, yyyy");
        weeksRemaining = Math.ceil(daysToComplete / 7);
      } else if (completed >= target) {
        projectedDate = "Completed";
      } else {
        projectedDate = "Needs more data";
      }

      return {
        type,
        completed,
        target,
        remaining,
        projectedDate,
        weeksRemaining,
        rate: rate * 7, // convert to per week
      };
    });

    return {
      weeklyData: weeklyChartData,
      cumulativeData,
      projections: projectionsList,
    };
  }, [procedures, targets]);

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border border-primary/10 bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[hsl(var(--accent-strong))] opacity-30 blur-3xl" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-base sm:text-lg">Weekly progress</CardTitle>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Cases logged per week over the last 12 weeks
          </p>
        </CardHeader>
        <CardContent className="relative z-10">
          {weeklyData.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/40 text-xs text-muted-foreground sm:text-sm">
              Add more cases to see weekly trends
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="circle"
                />
                {PROCEDURE_TYPES.map((type) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    fill={CHART_COLORS[type]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border border-primary/10 bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[hsl(var(--primary-soft))] opacity-30 blur-3xl" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-base sm:text-lg">Projected completion</CardTitle>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Estimated dates based on current pace
          </p>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3">
          {projections.map((proj) => (
            <div
              key={proj.type}
              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="text-xs font-medium sm:text-sm">{proj.type}</div>
                <div className="mt-0.5 text-[0.7rem] text-muted-foreground sm:text-xs">
                  {proj.completed} of {proj.target} completed ·{" "}
                  {proj.rate > 0 ? `${proj.rate.toFixed(1)}/week` : "No activity"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {proj.projectedDate === "Completed" ? (
                  <span className="rounded-full bg-[hsl(var(--accent-strong))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--accent-strong))]">
                    ✓ Completed
                  </span>
                ) : proj.projectedDate === "Needs more data" ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Needs data
                  </span>
                ) : (
                  <div className="text-right">
                    <div className="text-xs font-medium sm:text-sm">{proj.projectedDate}</div>
                    <div className="text-[0.7rem] text-muted-foreground">
                      ~{proj.weeksRemaining} week{proj.weeksRemaining !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

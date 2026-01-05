import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBatchStats } from "@/hooks/useBatchStats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Color palette for batches - vibrant colors matching the app design
const BATCH_COLORS = [
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#f97316", // Orange
  "#10b981", // Green
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#eab308", // Yellow
  "#ef4444", // Red
];

export const BatchTrendsChart = () => {
  const { data: batchStats, isLoading } = useBatchStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Performance Comparison</CardTitle>
          <CardDescription>Loading batch statistics...</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!batchStats || batchStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Performance Comparison</CardTitle>
          <CardDescription>Total verified procedures across all batches</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>No batch data available yet.</p>
            <p className="text-sm mt-2">Data will appear as batches complete procedures.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Performance Comparison</CardTitle>
        <CardDescription>
          Total verified procedures completed across all batches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={batchStats}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <defs>
              {BATCH_COLORS.map((color, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`batchGradient${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="batch"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{
                value: "Total Procedures",
                angle: -90,
                position: "insideLeft",
                style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
              formatter={(value: number) => [`${value} Total Procedures`, "Completed"]}
            />
            <Bar
              dataKey="total"
              radius={[8, 8, 0, 0]}
              maxBarSize={80}
            >
              {batchStats.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#batchGradient${index % BATCH_COLORS.length})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBatchComparison } from "@/hooks/useBatchComparison";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export const PeerComparisonChart = () => {
  const { data: comparisonData, isLoading } = useBatchComparison();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Batch Average</CardTitle>
          <CardDescription>Loading comparison data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData || comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Batch Average</CardTitle>
          <CardDescription>Compare your progress with batch peers</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>No batch data available yet.</p>
            <p className="text-sm mt-2">Join a batch to see comparisons.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance vs Batch Average</CardTitle>
        <CardDescription>
          Compare your verified procedures with your batch peers across departments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={comparisonData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="department"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, "auto"]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Radar
              name="Me"
              dataKey="myCount"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.5}
            />
            <Radar
              name="Batch Avg"
              dataKey="batchAvg"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.3}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
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
              formatter={(value: number, name: string) => [
                typeof value === 'number' ? value.toFixed(1) : value,
                name,
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

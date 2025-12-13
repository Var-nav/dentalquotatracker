import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, addWeeks, differenceInWeeks } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useProcedures } from "@/hooks/useProcedures";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { Calendar, TrendingUp, Target } from "lucide-react";

export const DepartmentAnalytics = () => {
  const { procedures } = useProcedures();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();

  const departmentColors: Record<string, { 
    hsl: string; 
    gradient: string; 
    border: string; 
    bg: string; 
    text: string;
    badge: string;
  }> = {
    'Oral Maxillofacial Surgery': { 
      hsl: 'hsl(var(--red))', 
      gradient: 'from-red-500 to-orange-500',
      border: 'border-red-500/30',
      bg: 'bg-gradient-to-br from-red-500/5 via-orange-500/5 to-red-500/5',
      text: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-500/20 text-red-700 dark:text-red-300'
    },
    'Oral Medicine and Radiology': { 
      hsl: 'hsl(var(--blue))', 
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      bg: 'bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
    },
    'Periodontics': { 
      hsl: 'hsl(var(--green))', 
      gradient: 'from-green-500 to-emerald-500',
      border: 'border-green-500/30',
      bg: 'bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5',
      text: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-500/20 text-green-700 dark:text-green-300'
    },
    'Pediatric Dentistry': { 
      hsl: 'hsl(var(--pink))', 
      gradient: 'from-pink-500 to-rose-500',
      border: 'border-pink-500/30',
      bg: 'bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-pink-500/5',
      text: 'text-pink-600 dark:text-pink-400',
      badge: 'bg-pink-500/20 text-pink-700 dark:text-pink-300'
    },
    'Endodontics': { 
      hsl: 'hsl(var(--purple))', 
      gradient: 'from-purple-500 to-violet-500',
      border: 'border-purple-500/30',
      bg: 'bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-purple-500/5',
      text: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
    },
    'Prosthodontics': { 
      hsl: 'hsl(var(--amber))', 
      gradient: 'from-amber-500 to-yellow-500',
      border: 'border-amber-500/30',
      bg: 'bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-amber-500/5',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
    },
    'Orthodontics': { 
      hsl: 'hsl(var(--indigo))', 
      gradient: 'from-indigo-500 to-blue-600',
      border: 'border-indigo-500/30',
      bg: 'bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-indigo-500/5',
      text: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
    },
    'Public Health Dentistry': { 
      hsl: 'hsl(var(--teal))', 
      gradient: 'from-teal-500 to-green-600',
      border: 'border-teal-500/30',
      bg: 'bg-gradient-to-br from-teal-500/5 via-green-600/5 to-teal-500/5',
      text: 'text-teal-600 dark:text-teal-400',
      badge: 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
    },
  };

  const weeklyData = useMemo(() => {
    if (procedures.length === 0) return [];

    const dates = procedures
      .map(p => new Date(p.procedure_date))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) return [];

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const weeks = eachWeekOfInterval(
      { start: startOfWeek(minDate), end: endOfWeek(maxDate) },
      { weekStartsOn: 1 }
    );

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, "MMM d");

      const departmentCounts: Record<string, number> = {};
      departments.forEach(dept => {
        departmentCounts[dept.name] = procedures.filter(p => {
          const procDate = new Date(p.procedure_date);
          return (
            p.department_id === dept.id &&
            isWithinInterval(procDate, { start: weekStart, end: weekEnd })
          );
        }).length;
      });

      return {
        week: weekLabel,
        ...departmentCounts,
      };
    });
  }, [procedures, departments]);

  const departmentProgress = useMemo(() => {
    return departments.map(dept => {
      const deptTasks = allTasks.filter(t => t.department_id === dept.id);
      const totalTarget = deptTasks.reduce((sum, t) => sum + t.target, 0);
      const completed = procedures.filter(p => p.department_id === dept.id).length;
      const percentage = totalTarget > 0 ? Math.round((completed / totalTarget) * 100) : 0;

      // Calculate weekly average
      const deptProcedures = procedures.filter(p => p.department_id === dept.id);
      const dates = deptProcedures.map(p => new Date(p.procedure_date));
      
      let weeklyAverage = 0;
      let projectedDate = null;

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date();
        const weeksPassed = differenceInWeeks(maxDate, minDate) || 1;
        weeklyAverage = deptProcedures.length / weeksPassed;

        const remaining = totalTarget - completed;
        if (weeklyAverage > 0 && remaining > 0) {
          const weeksNeeded = Math.ceil(remaining / weeklyAverage);
          projectedDate = format(addWeeks(new Date(), weeksNeeded), "MMM d, yyyy");
        }
      }

      return {
        name: dept.name,
        completed,
        target: totalTarget,
        percentage,
        weeklyAverage: weeklyAverage.toFixed(1),
        projectedDate,
        colors: departmentColors[dept.name] || {
          hsl: 'hsl(var(--primary))',
          gradient: 'from-primary to-secondary',
          border: 'border-primary/30',
          bg: 'bg-gradient-to-br from-primary/5 to-secondary/5',
          text: 'text-primary',
          badge: 'bg-primary/20 text-primary'
        },
      };
    }).filter(d => d.target > 0);
  }, [departments, allTasks, procedures, departmentColors]);

  const cumulativeData = useMemo(() => {
    if (procedures.length === 0) return [];

    const dates = procedures
      .map(p => new Date(p.procedure_date))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) return [];

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const weeks = eachWeekOfInterval(
      { start: startOfWeek(minDate), end: endOfWeek(maxDate) },
      { weekStartsOn: 1 }
    );

    let cumulativeCounts: Record<string, number> = {};
    departments.forEach(dept => {
      cumulativeCounts[dept.name] = 0;
    });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, "MMM d");

      departments.forEach(dept => {
        const count = procedures.filter(p => {
          const procDate = new Date(p.procedure_date);
          return (
            p.department_id === dept.id &&
            isWithinInterval(procDate, { start: weekStart, end: weekEnd })
          );
        }).length;
        cumulativeCounts[dept.name] += count;
      });

      return {
        week: weekLabel,
        ...cumulativeCounts,
      };
    });
  }, [procedures, departments]);

  return (
    <div className="space-y-4">
      <Card className="border border-info/20 bg-gradient-to-br from-card via-info/5 to-card shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-xl animate-fade-in">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-info to-blue-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Department Progress Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Completion status and projected dates for each department
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {departmentProgress.map((dept, index) => (
              <div
                key={dept.name}
                className={`p-4 rounded-lg border ${dept.colors.border} ${dept.colors.bg} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in relative overflow-hidden`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${dept.colors.gradient} opacity-10 rounded-full blur-2xl`} />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${dept.colors.gradient} flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0`}>
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <h4 className={`font-semibold text-sm line-clamp-2 ${dept.colors.text}`}>{dept.name}</h4>
                  </div>
                  <Badge
                    className={`ml-2 shrink-0 ${dept.colors.badge} border-0`}
                  >
                    {dept.percentage}%
                  </Badge>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground relative z-10">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className={`font-semibold ${dept.colors.text}`}>
                      {dept.completed} / {dept.target}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly avg:</span>
                    <span className={`font-semibold ${dept.colors.text}`}>{dept.weeklyAverage}</span>
                  </div>
                  {dept.projectedDate && dept.percentage < 100 && (
                    <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                      <Calendar className="h-3 w-3" />
                      <span className="text-[0.7rem]">Est: {dept.projectedDate}</span>
                    </div>
                  )}
                  {dept.percentage >= 100 && (
                    <div className="flex items-center gap-1 pt-1 border-t border-success/50 text-success">
                      <Target className="h-3 w-3" />
                      <span className="text-[0.7rem] font-medium">Completed!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-success/20 bg-gradient-to-br from-card via-success/5 to-card shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Trends</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track weekly and cumulative progress across all departments
          </p>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No procedure data yet. Add cases to see weekly trends.
            </div>
          ) : (
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly" className="mt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    {departments.map(dept => (
                      <Bar
                        key={dept.id}
                        dataKey={dept.name}
                        fill={departmentColors[dept.name]?.hsl || 'hsl(var(--primary))'}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="cumulative" className="mt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    {departments.map(dept => (
                      <Line
                        key={dept.id}
                        type="monotone"
                        dataKey={dept.name}
                        stroke={departmentColors[dept.name]?.hsl || 'hsl(var(--primary))'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

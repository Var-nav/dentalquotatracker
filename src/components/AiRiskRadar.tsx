import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, CheckCircle2, Activity } from "lucide-react";
import { useProcedures } from "@/hooks/useProcedures";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AiRiskRadar = () => {
  const { procedures } = useProcedures();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();

  // Calculate weeks remaining until end of year (or customize to academic calendar)
  const today = new Date();
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const weeksRemaining = Math.max(1, Math.ceil((endOfYear.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  // Calculate velocity per department
  const departmentAnalysis = departments.map(dept => {
    const deptTasks = allTasks.filter(t => t.department_id === dept.id);
    const totalTarget = deptTasks.reduce((sum, task) => sum + task.target, 0);
    
    const deptProcedures = procedures.filter(p => p.department_id === dept.id && p.status === 'verified');
    const completed = deptProcedures.length;
    
    const remaining = Math.max(0, totalTarget - completed);
    const requiredVelocity = remaining / weeksRemaining;
    
    // Calculate current velocity (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentProcedures = deptProcedures.filter(p => new Date(p.procedure_date) >= fourWeeksAgo);
    const currentVelocity = recentProcedures.length / 4;
    
    const percentComplete = totalTarget > 0 ? (completed / totalTarget) * 100 : 0;
    const onTrack = currentVelocity >= requiredVelocity || percentComplete >= 100;
    
    return {
      name: dept.name,
      totalTarget,
      completed,
      remaining,
      requiredVelocity,
      currentVelocity,
      onTrack,
      percentComplete
    };
  }).filter(d => d.totalTarget > 0); // Only show departments with targets

  const criticalDepts = departmentAnalysis.filter(d => !d.onTrack && d.remaining > 0);
  const onTrackDepts = departmentAnalysis.filter(d => d.onTrack || d.percentComplete >= 100);

  return (
    <Card className="border border-warning/20 bg-gradient-to-br from-card via-warning/5 to-card shadow-soft animate-fade-in">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center shadow-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            🤖 AI Risk Radar
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Intelligent velocity tracking • {weeksRemaining} weeks remaining
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Alerts */}
        {criticalDepts.length > 0 && (
          <div className="space-y-3">
            {criticalDepts.map(dept => (
              <Alert key={dept.name} variant="destructive" className="border-warning/50 bg-warning/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong className="font-semibold">⚠️ Falling Behind: {dept.name}</strong>
                  <div className="mt-1 text-xs space-y-1">
                    <div>Current pace: {dept.currentVelocity.toFixed(1)} cases/week</div>
                    <div>Required pace: <span className="font-semibold text-warning">{dept.requiredVelocity.toFixed(1)} cases/week</span></div>
                    <div className="text-muted-foreground">{dept.completed}/{dept.totalTarget} completed ({dept.percentComplete.toFixed(0)}%)</div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* On Track Departments */}
        {onTrackDepts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              On Track
            </h4>
            {onTrackDepts.map(dept => (
              <div
                key={dept.name}
                className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs"
              >
                <div className="font-medium text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {dept.name}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {dept.percentComplete >= 100 ? (
                    "✅ Complete!"
                  ) : (
                    <>Current: {dept.currentVelocity.toFixed(1)}/week • Target: {dept.requiredVelocity.toFixed(1)}/week</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {departmentAnalysis.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No departments with active targets yet. Start logging cases to see velocity insights!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

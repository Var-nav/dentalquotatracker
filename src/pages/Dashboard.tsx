import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { DepartmentAccordion } from "@/components/DepartmentAccordion";
import { GamificationWidget } from "@/components/GamificationWidget";
import { AiRiskRadar } from "@/components/AiRiskRadar";
import { useUserMeta } from "@/hooks/useUserMeta";
import { Target } from "lucide-react";

const Dashboard = () => {
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: allTasks = [], isLoading: tasksLoading } = useQuotaTasks();
  const { meta } = useUserMeta();

  const isLoading = departmentsLoading || tasksLoading;
  const isStudent = meta.role === "student";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
          Department Quotas
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your clinical requirements across all departments
        </p>
      </div>

      {/* AI-Powered Features - Only for Students */}
      {isStudent && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GamificationWidget />
          <AiRiskRadar />
        </div>
      )}

      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">All Departments</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Expand each department to view quota tasks and track progress
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-pulse">Loading departments...</div>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No departments found. Please contact support.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-0">
              {departments.map((department, index) => {
                const departmentTasks = allTasks.filter(
                  (task) => task.department_id === department.id
                );
                
                return (
                  <div 
                    key={department.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <DepartmentAccordion
                      department={department}
                      tasks={departmentTasks}
                    />
                  </div>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-info/20 bg-gradient-to-br from-card via-info/5 to-card shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="text-base">Total Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-info">{departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active clinical departments</p>
          </CardContent>
        </Card>

        <Card className="border border-success/20 bg-gradient-to-br from-card via-success/5 to-card shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-base">Total Quota Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">{allTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {allTasks.filter(t => t.is_predefined).length} predefined, {allTasks.filter(t => !t.is_predefined).length} custom
            </p>
          </CardContent>
        </Card>

        <Card className="border border-warning/20 bg-gradient-to-br from-card via-warning/5 to-card shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="text-base">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Click "Add Custom Task" to create new quota tasks</p>
            <p>• Edit targets by clicking the edit icon</p>
            <p>• Delete custom tasks with the trash icon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { DepartmentAccordion } from "@/components/DepartmentAccordion";
import { DepartmentAnalytics } from "@/components/DepartmentAnalytics";
import { AddProcedureForm } from "@/components/AddProcedureForm";
import { Target } from "lucide-react";

const Index = () => {
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: allTasks = [], isLoading: tasksLoading } = useQuotaTasks();

  const isLoading = departmentsLoading || tasksLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple/5 via-background to-teal/5 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: "Dental Clinical Quota Dashboard",
            description:
              "Dashboard for dental students to track clinical quotas across all departments.",
            educationalCredentialAwarded: "DDS Clinical Requirements",
            provider: {
              "@type": "CollegeOrUniversity",
              name: "Dental School",
            },
          }),
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Clinical tracker
            </p>
            <h1 className="bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-purple via-primary to-teal">
              Dental Clinical Quota Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Track your clinical requirements across all departments. Manage quota tasks, set targets, and monitor your progress toward graduation.
            </p>
          </div>
          <div className="hidden shrink-0 items-center rounded-full border border-success/20 bg-success/10 px-4 py-2 text-xs shadow-soft transition-all duration-300 hover:scale-105 hover:shadow-lg md:flex">
            <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="font-medium text-success-foreground">Today&apos;s progress</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-xl animate-fade-in">
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Department Quotas</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Expand each department to view quota tasks, track progress, and add custom tasks
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

              <DepartmentAnalytics />
            </div>

            <div>
              <AddProcedureForm />
            </div>
          </div>

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
        </main>
      </div>
    </div>
  );
};

export default Index;

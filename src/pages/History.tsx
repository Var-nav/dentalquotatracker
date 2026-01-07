import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EditProcedureDialog } from "@/components/EditProcedureDialog";
import { ExportLogbookButton } from "@/components/ExportLogbookButton";
import { useProcedures, Procedure } from "@/hooks/useProcedures";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { useToast } from "@/hooks/use-toast";

const History = () => {
  const { toast } = useToast();
  const { procedures, updateProcedure, deleteProcedure } = useProcedures();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const filteredProcedures = useMemo(() => {
    return procedures.filter((proc) => {
      const patientName = (proc.patient_name ?? "").toLowerCase();
      const supervisorName = (proc.supervisor_name ?? "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        patientName.includes(query) || supervisorName.includes(query);

      const matchesDepartment =
        filterDepartment === "all" || proc.department_id === filterDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [procedures, searchQuery, filterDepartment]);

  const handleEditProcedure = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    updates: Partial<Omit<Procedure, "id" | "created_at">>
  ) => {
    try {
      await updateProcedure({ id, updates });
      toast({
        title: "Case updated",
        description: "Procedure has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating case",
        description: "Could not update the case. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteProcedure = async (id: string, patientName: string) => {
    try {
      await deleteProcedure(id);
      toast({
        title: "Case deleted",
        description: `Procedure for ${patientName} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting case",
        description: "Could not delete the case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDepartmentName = (deptId: string | null | undefined) => {
    if (!deptId) return "Unknown";
    return departments.find((d) => d.id === deptId)?.name || "Unknown";
  };

  const getTaskName = (taskId: string | null | undefined) => {
    if (!taskId) return null;
    return allTasks.find((t) => t.id === taskId)?.task_name;
  };

  const departmentColors: Record<string, string> = {
    "Oral Maxillofacial Surgery":
      "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    "Oral Medicine and Radiology":
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    Periodontics:
      "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    "Pediatric Dentistry":
      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30",
    Endodontics:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    Prosthodontics:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    Orthodontics:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    "Public Health Dentistry":
      "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            Case History
          </h1>
          <p className="text-muted-foreground mt-2">
            View, edit, and manage all logged procedures
          </p>
        </div>
        <ExportLogbookButton />
      </div>

      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-lg">Filter & Search</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient or supervisor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg z-50">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProcedures.length === 0 ? (
            procedures.length === 0 && !searchQuery && filterDepartment === "all" ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card/60 p-8 sm:p-10 text-center flex flex-col items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
                  <span className="text-2xl">📘</span>
                </div>
                <div className="space-y-1 max-w-md">
                  <h2 className="text-lg font-semibold text-foreground">No cases yet</h2>
                  <p className="text-sm text-muted-foreground">
                    Start your logbook by adding your first patient case. Each case you add will appear here for easy review and export.
                  </p>
                </div>
                <Button asChild className="mt-2 px-6">
                  <a href="/add-case">Add your first case</a>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-12 text-center">
                <p className="text-muted-foreground">No cases match your filters</p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {filteredProcedures.map((entry, index) => {
                const deptName = getDepartmentName(entry.department_id);
                const taskName = getTaskName(entry.quota_task_id);
                const badgeColor =
                  departmentColors[deptName] || "bg-muted text-muted-foreground";

                return (
                  <div
                    key={entry.id}
                    className="group p-4 rounded-lg border border-border/50 bg-background/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{entry.patient_name}</h3>
                          <Badge className={`${badgeColor} border`}>
                            {deptName}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">Task:</span>{" "}
                            {taskName || entry.procedure_type}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Date:</span>{" "}
                            {format(new Date(entry.procedure_date), "MMM d, yyyy")}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-foreground">Supervisor:</span>{" "}
                            {entry.supervisor_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEditProcedure(entry)}
                          title="Edit case"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                          onClick={() =>
                            handleDeleteProcedure(entry.id, entry.patient_name)
                          }
                          title="Delete case"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EditProcedureDialog
        procedure={editingProcedure}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default History;

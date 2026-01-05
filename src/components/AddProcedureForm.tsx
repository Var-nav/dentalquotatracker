import { useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { useProcedures } from "@/hooks/useProcedures";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const AddProcedureForm = () => {
  const { toast } = useToast();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();
  const { addProcedure } = useProcedures();

  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [supervisorName, setSupervisorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTasks = allTasks.filter(
    (task) => task.department_id === selectedDepartment
  );

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedTask(""); // Reset task when department changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment || !selectedTask || !date || !supervisorName.trim()) {
      toast({
        title: "Missing information",
        description: "Please complete all fields before adding a case.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const task = allTasks.find(t => t.id === selectedTask);
      
      await addProcedure({
        procedure_type: (task?.task_name || "Unknown") as any, // Legacy field, actual tracking is by quota_task_id
        procedure_date: format(date, "yyyy-MM-dd"),
        supervisor_name: supervisorName.trim(),
        department_id: selectedDepartment,
        quota_task_id: selectedTask,
        status: 'pending',
      });

      // Reset form
      setSelectedDepartment("");
      setSelectedTask("");
      setDate(undefined);
      setSupervisorName("");

      toast({
        title: "Case added",
        description: `${task?.task_name} recorded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error adding case",
        description: "Could not save the case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeptColors = departments.find(d => d.id === selectedDepartment);
  const departmentColorMap: Record<string, string> = {
    'Oral Maxillofacial Surgery': 'from-red-500 to-orange-500',
    'Oral Medicine and Radiology': 'from-blue-500 to-cyan-500',
    'Periodontics': 'from-green-500 to-emerald-500',
    'Pediatric Dentistry': 'from-pink-500 to-rose-500',
    'Endodontics': 'from-purple-500 to-violet-500',
    'Prosthodontics': 'from-amber-500 to-yellow-500',
    'Orthodontics': 'from-indigo-500 to-blue-600',
    'Public Health Dentistry': 'from-teal-500 to-green-600',
  };

  return (
    <Card className="border border-pink/20 bg-gradient-to-br from-card via-pink/5 to-card shadow-soft transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in sticky top-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink opacity-20 blur-3xl" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Patient Case
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Log a new procedure for quota tracking
        </p>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <Label htmlFor="department">Department</Label>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg z-50">
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full bg-gradient-to-br ${
                          departmentColorMap[dept.name] || 'from-primary to-secondary'
                        }`}
                      />
                      {dept.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Label htmlFor="quotaTask">Quota Task</Label>
            <Select
              value={selectedTask}
              onValueChange={setSelectedTask}
              disabled={!selectedDepartment}
            >
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary">
                <SelectValue placeholder={selectedDepartment ? "Select quota task" : "Select department first"} />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg z-50">
                {availableTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>{task.task_name}</span>
                      {task.is_predefined && (
                        <span className="text-xs text-muted-foreground">(predefined)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <Label>Procedure Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal transition-all duration-200 hover:bg-accent",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border border-border shadow-lg z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Label htmlFor="supervisorName">Supervisor Name</Label>
            <Input
              id="supervisorName"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Dr. Johnson"
              autoComplete="off"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl animate-fade-in"
            style={{ animationDelay: "0.25s" }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Case"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

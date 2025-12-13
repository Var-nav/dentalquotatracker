import { useState } from "react";
import { Plus, Target, Trash2, Edit2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Department } from "@/hooks/useDepartments";
import { QuotaTask, useAddQuotaTask, useUpdateQuotaTask, useDeleteQuotaTask } from "@/hooks/useQuotaTasks";
import { useProcedures } from "@/hooks/useProcedures";

interface DepartmentAccordionProps {
  department: Department;
  tasks: QuotaTask[];
}

export const DepartmentAccordion = ({ department, tasks }: DepartmentAccordionProps) => {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskTarget, setNewTaskTarget] = useState("10");
  const [editingTask, setEditingTask] = useState<{ id: string; target: number } | null>(null);

  const { procedures } = useProcedures();
  const addTaskMutation = useAddQuotaTask();
  const updateTaskMutation = useUpdateQuotaTask();
  const deleteTaskMutation = useDeleteQuotaTask();

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTaskMutation.mutate({
        department_id: department.id,
        task_name: newTaskName.trim(),
        target: parseInt(newTaskTarget) || 10,
      });
      setNewTaskName("");
      setNewTaskTarget("10");
      setIsAddTaskOpen(false);
    }
  };

  const handleUpdateTarget = (taskId: string) => {
    if (editingTask && editingTask.id === taskId) {
      updateTaskMutation.mutate(editingTask);
      setEditingTask(null);
    }
  };

  const getTaskProgress = (taskId: string) => {
    return procedures.filter(p => p.quota_task_id === taskId).length;
  };

  const departmentColors: Record<string, { gradient: string; border: string; bg: string; text: string }> = {
    'Oral Maxillofacial Surgery': { 
      gradient: 'from-red-500 to-orange-500',
      border: 'border-red-500/30',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      text: 'text-red-600 dark:text-red-400'
    },
    'Oral Medicine and Radiology': { 
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400'
    },
    'Periodontics': { 
      gradient: 'from-green-500 to-emerald-500',
      border: 'border-green-500/30',
      bg: 'bg-green-500/5 hover:bg-green-500/10',
      text: 'text-green-600 dark:text-green-400'
    },
    'Pediatric Dentistry': { 
      gradient: 'from-pink-500 to-rose-500',
      border: 'border-pink-500/30',
      bg: 'bg-pink-500/5 hover:bg-pink-500/10',
      text: 'text-pink-600 dark:text-pink-400'
    },
    'Endodontics': { 
      gradient: 'from-purple-500 to-violet-500',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5 hover:bg-purple-500/10',
      text: 'text-purple-600 dark:text-purple-400'
    },
    'Prosthodontics': { 
      gradient: 'from-amber-500 to-yellow-500',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400'
    },
    'Orthodontics': { 
      gradient: 'from-indigo-500 to-blue-600',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/5 hover:bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    'Public Health Dentistry': { 
      gradient: 'from-teal-500 to-green-600',
      border: 'border-teal-500/30',
      bg: 'bg-teal-500/5 hover:bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400'
    },
  };

  const colors = departmentColors[department.name] || { 
    gradient: 'from-primary to-secondary',
    border: 'border-primary/30',
    bg: 'bg-primary/5 hover:bg-primary/10',
    text: 'text-primary'
  };

  return (
    <AccordionItem 
      value={department.id} 
      className={`border ${colors.border} rounded-lg px-4 mb-3 ${colors.bg} backdrop-blur-sm transition-all duration-300 animate-fade-in shadow-sm hover:shadow-lg`}
    >
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ring-2 ring-white/20`}>
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className={`font-semibold text-lg ${colors.text}`}>{department.name}</h3>
              <p className="text-sm text-muted-foreground">{tasks.length} quota tasks</p>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-4">
        <div className="space-y-4">
          {tasks.map((task, index) => {
            const completed = getTaskProgress(task.id);
            const percentage = (completed / task.target) * 100;
            
            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{task.task_name}</h4>
                    {task.is_predefined && (
                      <span className="text-xs text-muted-foreground">Predefined</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => setEditingTask({ id: task.id, target: task.target })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="animate-scale-in">
                        <DialogHeader>
                          <DialogTitle>Edit Target</DialogTitle>
                          <DialogDescription>
                            Update the target for {task.task_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="target">Target</Label>
                            <Input
                              id="target"
                              type="number"
                              value={editingTask?.id === task.id ? editingTask.target : task.target}
                              onChange={(e) => setEditingTask({ id: task.id, target: parseInt(e.target.value) || 0 })}
                              min="1"
                            />
                          </div>
                          <Button
                            onClick={() => handleUpdateTarget(task.id)}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          >
                            Save Target
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {!task.is_predefined && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="animate-scale-in">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Quota Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.task_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {completed} / {task.target}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            );
          })}

          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Task
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scale-in">
              <DialogHeader>
                <DialogTitle>Add New Quota Task</DialogTitle>
                <DialogDescription>
                  Add a custom quota task for {department.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="e.g., Advanced Procedures"
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="taskTarget">Target</Label>
                  <Input
                    id="taskTarget"
                    type="number"
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(e.target.value)}
                    min="1"
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button
                  onClick={handleAddTask}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
                  disabled={!newTaskName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

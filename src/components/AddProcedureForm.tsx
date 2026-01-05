import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Mic, MicOff, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseClinicalNoteWithAI } from "@/lib/clinicalParser";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const AddProcedureForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();
  const { addProcedure } = useProcedures();

  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [supervisorName, setSupervisorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Magic Fill state
  const [magicFillText, setMagicFillText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiCorrectionEnabled, setAiCorrectionEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const aiCorrectionEnabledRef = useRef(true);

  // Track which fields were manually entered (don't overwrite them)
  const [manuallySet, setManuallySet] = useState({
    department: false,
    task: false,
    supervisor: false
  });

  const availableTasks = allTasks.filter(
    (task) => task.department_id === selectedDepartment
  );

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        let finalText = transcript;

        if (aiCorrectionEnabledRef.current) {
          try {
            toast({
              title: "🩺 Cleaning up transcript...",
              description: "Fixing medical terms and misheard words",
            });

            const { data, error } = await supabase.functions.invoke('correct-clinical-note', {
              body: { text: transcript },
            });

            if (!error && data?.correctedText) {
              finalText = data.correctedText as string;
            }
          } catch (err) {
            console.warn('AI correction failed, using raw transcript', err);
          }
        }

        setMagicFillText(finalText);
        handleMagicFill(finalText);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);


  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedTask(""); // Reset task when department changes
    setManuallySet(prev => ({ ...prev, department: true, task: true }));
  };

  const handleTaskChange = (value: string) => {
    setSelectedTask(value);
    setManuallySet(prev => ({ ...prev, task: true }));
  };

  const handleSupervisorChange = (value: string) => {
    setSupervisorName(value);
    setManuallySet(prev => ({ ...prev, supervisor: true }));
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleMagicFill = async (text: string) => {
    if (!text.trim()) return;

    // Show loading state
    toast({
      title: "🤖 AI Processing...",
      description: "Analyzing your clinical note",
    });

    const parsed = await parseClinicalNoteWithAI(text, departments, allTasks);

    // Only auto-fill fields that weren't manually set
    if (parsed.department && !manuallySet.department) {
      setSelectedDepartment(parsed.department);
    }
    
    if (parsed.task && !manuallySet.task) {
      setSelectedTask(parsed.task);
    }
    
    if (parsed.supervisorName && !manuallySet.supervisor) {
      setSupervisorName(parsed.supervisorName);
    }

    // Show feedback
    const filledFields = [];
    if (parsed.department) filledFields.push("Department");
    if (parsed.task) filledFields.push("Quota Task");
    if (parsed.supervisorName) filledFields.push("Supervisor");

    if (filledFields.length > 0) {
      toast({
        title: "✨ Magic Fill Applied",
        description: `Auto-filled: ${filledFields.join(", ")}`,
      });
    }
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
        student_id: user?.id,
      });

      // Reset form
      setSelectedDepartment("");
      setSelectedTask("");
      setDate(undefined);
      setSupervisorName("");
      setMagicFillText("");
      setManuallySet({ department: false, task: false, supervisor: false });

      toast({
        title: "Case logged! Marked as In Progress.",
        description: `${task?.task_name} has been submitted for verification.`,
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
          {/* Magic Fill Section */}
          <div className="space-y-2 p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-purple/5 animate-fade-in">
            <Label htmlFor="magicFill" className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              ✨ Magic Fill
            </Label>
            <div className="flex gap-2">
              <Textarea
                id="magicFill"
                value={magicFillText}
                onChange={(e) => {
                  setMagicFillText(e.target.value);
                }}
                onBlur={() => handleMagicFill(magicFillText)}
                placeholder='Example: "Did an extraction in Surgery with Dr. Smith"'
                className="min-h-[60px] resize-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleVoiceRecognition}
                className={cn(
                  "shrink-0 transition-all",
                  isListening && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                )}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-primary animate-pulse">🎤 Listening...</p>
            )}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Speak or type naturally - AI will auto-fill the fields below
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">AI correction</span>
                <Switch
                  checked={aiCorrectionEnabled}
                  onCheckedChange={(checked) => {
                    setAiCorrectionEnabled(checked);
                    aiCorrectionEnabledRef.current = checked;
                  }}
                  className="scale-90"
                />
              </div>
            </div>
          </div>

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
              onValueChange={handleTaskChange}
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
              onChange={(e) => handleSupervisorChange(e.target.value)}
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

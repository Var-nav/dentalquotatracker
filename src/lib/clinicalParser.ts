import { Department } from "@/hooks/useDepartments";
import { QuotaTask } from "@/hooks/useQuotaTasks";
import { supabase } from "@/integrations/supabase/client";

interface ParsedData {
  department?: string;
  task?: string;
  supervisorName?: string;
}

/**
 * Parse clinical note text using AI-powered structured extraction
 * Falls back to regex/keyword approach if API fails
 */
export async function parseClinicalNoteWithAI(
  text: string,
  departments: Department[],
  tasks: QuotaTask[]
): Promise<ParsedData> {
  try {
    // Try AI parsing first
    const { data, error } = await supabase.functions.invoke('parse-clinical-note', {
      body: {
        text,
        departments: departments.map(d => ({ id: d.id, name: d.name })),
        tasks: tasks.map(t => ({ 
          id: t.id, 
          task_name: t.task_name,
          department_id: t.department_id 
        }))
      }
    });

    if (error) {
      console.warn('AI parsing failed, falling back to regex:', error);
      return parseClinicalNoteRegex(text, departments, tasks);
    }

    // Return AI result if we got valid data
    if (data && (data.department || data.task || data.supervisorName)) {
      return {
        department: data.department,
        task: data.task,
        supervisorName: data.supervisorName
      };
    }

    // Fall back to regex if AI returned empty
    return parseClinicalNoteRegex(text, departments, tasks);
  } catch (error) {
    console.warn('AI parsing error, falling back to regex:', error);
    return parseClinicalNoteRegex(text, departments, tasks);
  }
}

/**
 * Parse clinical note text using regex/keyword approach (fallback method)
 * Detects department, procedure type, and supervisor name
 */
function parseClinicalNoteRegex(
  text: string,
  departments: Department[],
  tasks: QuotaTask[]
): ParsedData {
  const parsed: ParsedData = {};
  const lowerText = text.toLowerCase();

  // Department detection (case-insensitive)
  for (const dept of departments) {
    const deptLower = dept.name.toLowerCase();
    if (lowerText.includes(deptLower)) {
      parsed.department = dept.id;
      break;
    }
    
    // Check for department keywords
    if (
      (lowerText.includes("surgery") && deptLower.includes("surgery")) ||
      (lowerText.includes("radiology") && deptLower.includes("radiology")) ||
      (lowerText.includes("perio") && deptLower.includes("perio")) ||
      (lowerText.includes("pediatric") && deptLower.includes("pediatric")) ||
      (lowerText.includes("endo") && deptLower.includes("endo")) ||
      (lowerText.includes("prostho") && deptLower.includes("prostho")) ||
      (lowerText.includes("ortho") && deptLower.includes("ortho")) ||
      (lowerText.includes("public health") && deptLower.includes("public"))
    ) {
      parsed.department = dept.id;
      break;
    }
  }

  // Task detection based on keywords
  if (parsed.department) {
    const departmentTasks = tasks.filter(t => t.department_id === parsed.department);
    
    for (const task of departmentTasks) {
      const taskLower = task.task_name.toLowerCase();
      
      // Direct match
      if (lowerText.includes(taskLower)) {
        parsed.task = task.id;
        break;
      }
      
      // Keyword-based matching
      if (
        (lowerText.includes("extraction") && taskLower.includes("exo")) ||
        (lowerText.includes("filling") && taskLower.includes("restor")) ||
        (lowerText.includes("root canal") && taskLower.includes("rct")) ||
        (lowerText.includes("crown") && (taskLower.includes("crown") || taskLower.includes("fpd"))) ||
        (lowerText.includes("scaling") && taskLower.includes("scal")) ||
        (lowerText.includes("x-ray") && taskLower.includes("radiograph"))
      ) {
        parsed.task = task.id;
        break;
      }
    }
  }

  // Supervisor name detection (Dr. [Name] pattern)
  const drMatch = text.match(/Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (drMatch) {
    parsed.supervisorName = `Dr. ${drMatch[1]}`;
  }

  return parsed;
}

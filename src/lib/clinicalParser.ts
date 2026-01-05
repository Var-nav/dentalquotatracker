import { Department } from "@/hooks/useDepartments";
import { QuotaTask } from "@/hooks/useQuotaTasks";

interface ParsedData {
  department?: string;
  task?: string;
  supervisorName?: string;
}

/**
 * Parse clinical note text using regex/keyword approach
 * Detects department, procedure type, and supervisor name
 */
export function parseClinicalNote(
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

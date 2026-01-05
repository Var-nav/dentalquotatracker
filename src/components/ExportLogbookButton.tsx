import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useProcedures } from "@/hooks/useProcedures";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuotaTasks } from "@/hooks/useQuotaTasks";
import { useAuth } from "@/hooks/useAuth";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const ExportLogbookButton = () => {
  const { procedures } = useProcedures();
  const { data: departments = [] } = useDepartments();
  const { data: allTasks = [] } = useQuotaTasks();
  const { user } = useAuth();
  const { meta } = useUserMeta();
  const { toast } = useToast();

  const getDepartmentName = (deptId: string | null | undefined) => {
    if (!deptId) return "Unknown";
    return departments.find((d) => d.id === deptId)?.name || "Unknown";
  };

  const getTaskName = (taskId: string | null | undefined) => {
    if (!taskId) return null;
    return allTasks.find((t) => t.id === taskId)?.task_name;
  };

  const getStatusText = (status: string | null | undefined) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleExport = async () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Clinical Logbook", 105, 20, { align: "center" });

      // Student Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${user?.email || "Unknown"}`, 20, 35);
      doc.text(`Batch: ${meta.batchName || "Not Assigned"}`, 20, 42);

      // Summary Stats
      const totalCases = procedures.length;
      const verifiedCases = procedures.filter((p) => p.status === "verified").length;
      const pendingCases = procedures.filter((p) => p.status === "pending").length;
      const rejectedCases = procedures.filter((p) => p.status === "rejected").length;

      doc.setFontSize(10);
      doc.text(`Total Cases: ${totalCases} | Verified: ${verifiedCases} | Pending: ${pendingCases} | Rejected: ${rejectedCases}`, 20, 52);

      // Table
      const tableData = procedures.map((proc) => [
        format(new Date(proc.procedure_date), "MMM d, yyyy"),
        proc.patient_op_number || "N/A",
        getTaskName(proc.quota_task_id) || proc.procedure_type || "N/A",
        getDepartmentName(proc.department_id),
        proc.supervisor_name,
        getStatusText(proc.status),
      ]);

      autoTable(doc, {
        head: [["Date", "Patient ID", "Procedure", "Department", "Supervisor", "Status"]],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 25 },
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")} | Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Logbook_${user?.email?.split("@")[0] || "Student"}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`;
      doc.save(fileName);

      toast({
        title: "Logbook Exported! 📄",
        description: `Your logbook has been saved as ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting logbook:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your logbook. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleExport}
      className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
      disabled={procedures.length === 0}
    >
      <FileDown className="h-4 w-4" />
      Export Logbook (PDF)
    </Button>
  );
};

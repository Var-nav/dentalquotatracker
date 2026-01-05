import { DepartmentAnalytics } from "@/components/DepartmentAnalytics";
import { InstructorSupervisorPanel } from "@/components/InstructorSupervisorPanel";
import { PeerComparisonChart } from "@/components/PeerComparisonChart";

const Analytics = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
          Analytics & Progress
        </h1>
        <p className="text-muted-foreground mt-2">
          View weekly trends, projected completion dates, and instructor approvals.
        </p>
      </div>

      <PeerComparisonChart />
      <DepartmentAnalytics />
      <InstructorSupervisorPanel />
    </div>
  );
};

export default Analytics;

import { AddProcedureForm } from "@/components/AddProcedureForm";

const AddCase = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
          Add Patient Case
        </h1>
        <p className="text-muted-foreground mt-2">
          Log a new procedure for quota tracking
        </p>
      </div>

      <div className="max-w-2xl">
        <AddProcedureForm />
      </div>
    </div>
  );
};

export default AddCase;

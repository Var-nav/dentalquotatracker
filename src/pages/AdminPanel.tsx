import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Layers } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { BatchAssignments } from "@/components/admin/BatchAssignments";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            <Shield className="h-5 w-5 text-primary" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and batch assignments for Varshify
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Batch Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <BatchAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;

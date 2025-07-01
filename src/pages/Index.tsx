
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ROF5Form from "@/components/ROF5Form";
import DocumentTemplates from "@/components/DocumentTemplates";
import Reports from "@/components/Reports";
import ReminderManager from "@/components/ReminderManager";
import DashboardLayout from "@/components/DashboardLayout";
import DarkWorkflowDashboard from "@/components/DarkWorkflowDashboard";
import StatsGrid from "@/components/StatsGrid";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { hasPermission } = useUser();

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <StatsGrid />
            <DarkWorkflowDashboard />
          </div>
        );
      case "rof5":
        return hasPermission('create-instruction') ? (
          <ROF5Form />
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400">You don't have permission to create new instructions.</p>
            </CardContent>
          </Card>
        );
      case "templates":
        return <DocumentTemplates />;
      case "reminders":
        return hasPermission('view-dashboard') ? (
          <ReminderManager />
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400">You don't have permission to manage reminders.</p>
            </CardContent>
          </Card>
        );
      case "reports":
        return hasPermission('generate-reports') ? (
          <Reports />
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400">You don't have permission to generate reports.</p>
            </CardContent>
          </Card>
        );
      default:
        return <DarkWorkflowDashboard />;
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </DashboardLayout>
  );
};

export default Index;

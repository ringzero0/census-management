import { DashboardWidgets } from "@/components/admin/dashboard-widgets";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Overview of census activities and system status." />
      <DashboardWidgets />
    </div>
  );
}

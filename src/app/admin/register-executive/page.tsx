import { RegisterExecutiveForm } from "@/components/admin/register-executive-form";
import { PageHeader } from "@/components/shared/page-header";

export default function RegisterExecutivePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Register New Executive" description="Fill in the details to create a new executive account." />
      <RegisterExecutiveForm />
    </div>
  );
}
